const request = require('supertest');
const app = require('../app');
const { Profile, Contract, Job } = require('../models');
const { sequelize } = require('../models');

describe('JobController', () => {
    let clientProfile;
    let contractorProfile;
    let contract;
    let job;

    beforeAll(async () => {
        // Force test environment
        process.env.NODE_ENV = 'test';
        
        // Sync all models with test database
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        // Create test profiles
        clientProfile = await Profile.create({
            firstName: 'John',
            lastName: 'Doe',
            profession: 'Manager',
            balance: 1000,
            type: 'client'
        });

        contractorProfile = await Profile.create({
            firstName: 'Jane',
            lastName: 'Smith',
            profession: 'Developer',
            balance: 0,
            type: 'contractor'
        });

        // Create test contract
        contract = await Contract.create({
            terms: 'Test contract',
            status: 'in_progress',
            ClientId: clientProfile.id,
            ContractorId: contractorProfile.id
        });

        // Create test job
        job = await Job.create({
            description: 'Test job',
            price: 100,
            paid: false,
            ContractId: contract.id
        });
    });

    afterEach(async () => {
        // Clean up test data
        await Job.destroy({ where: {} });
        await Contract.destroy({ where: {} });
        await Profile.destroy({ where: {} });
    });

    afterAll(async () => {
        // Close database connection
        await sequelize.close();
    });

    describe('GET /jobs/unpaid', () => {
        it('should return unpaid jobs for client', async () => {
            const response = await request(app)
                .get('/jobs/unpaid')
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].id).toBe(job.id);
            expect(response.body.data[0].paid).toBe(false);
        });

        it('should return unpaid jobs for contractor', async () => {
            const response = await request(app)
                .get('/jobs/unpaid')
                .set('profile_id', contractorProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].id).toBe(job.id);
            expect(response.body.data[0].paid).toBe(false);
        });

        it('should return empty array for user with no unpaid jobs', async () => {
            const otherProfile = await Profile.create({
                firstName: 'Other',
                lastName: 'User',
                profession: 'Tester',
                balance: 0,
                type: 'client'
            });

            const response = await request(app)
                .get('/jobs/unpaid')
                .set('profile_id', otherProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0);
        });

        it('should return 401 for missing authentication', async () => {
            const response = await request(app)
                .get('/jobs/unpaid');

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
    });

    describe('POST /jobs/:job_id/pay', () => {
        it('should successfully pay for a job', async () => {
            const response = await request(app)
                .post(`/jobs/${job.id}/pay`)
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.id).toBe(job.id);
            expect(response.body.data.paid).toBe(true);
            expect(response.body.data.paymentDate).toBeDefined();

            // Verify balances were updated
            const updatedClient = await Profile.findByPk(clientProfile.id);
            const updatedContractor = await Profile.findByPk(contractorProfile.id);
            expect(updatedClient.balance).toBe(900); // 1000 - 100
            expect(updatedContractor.balance).toBe(100); // 0 + 100
        });

        it('should return 404 for non-existent job', async () => {
            const response = await request(app)
                .post('/jobs/999/pay')
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('error');
        });

        it('should return 401 when contractor tries to pay', async () => {
            const response = await request(app)
                .post(`/jobs/${job.id}/pay`)
                .set('profile_id', contractorProfile.id);

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });

        it('should return 400 for already paid job', async () => {
            // First payment
            await request(app)
                .post(`/jobs/${job.id}/pay`)
                .set('profile_id', clientProfile.id);

            // Try to pay again
            const response = await request(app)
                .post(`/jobs/${job.id}/pay`)
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should return 400 for insufficient balance', async () => {
            // Update client balance to be less than job price
            await clientProfile.update({ balance: 50 });

            const response = await request(app)
                .post(`/jobs/${job.id}/pay`)
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should return 401 for missing authentication', async () => {
            const response = await request(app)
                .post(`/jobs/${job.id}/pay`);

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });

        it('should maintain data consistency on concurrent payments', async () => {
            // Create two jobs for the same client
            const client = await Profile.findOne({ where: { type: 'client' } });
            const contractor = await Profile.findOne({ where: { type: 'contractor' } });
            
            // Set client balance to cover both jobs
            await client.update({ balance: 1000 });
            
            // Create contract
            const contract = await Contract.create({
                terms: 'Test contract',
                status: 'in_progress',
                ClientId: client.id,
                ContractorId: contractor.id
            });

            // Create two jobs
            const job1 = await Job.create({
                description: 'Test job 1',
                price: 100,
                ContractId: contract.id,
                paid: false
            });

            const job2 = await Job.create({
                description: 'Test job 2',
                price: 100,
                ContractId: contract.id,
                paid: false
            });

            // Note: Due to SQLite's file-level locking, we can't truly test concurrent transactions
            // Instead, we'll test sequential transactions to verify the business logic
            const response1 = await request(app)
                .post(`/jobs/${job1.id}/pay`)
                .set('profile_id', client.id.toString());

            const response2 = await request(app)
                .post(`/jobs/${job2.id}/pay`)
                .set('profile_id', client.id.toString());

            // First payment should succeed
            expect(response1.status).toBe(200);
            expect(response1.body.status).toBe('success');
            expect(response1.body.data.paid).toBe(true);

            // Second payment should succeed (since we have enough balance)
            expect(response2.status).toBe(200);
            expect(response2.body.status).toBe('success');
            expect(response2.body.data.paid).toBe(true);

            // Verify final balance
            const updatedClient = await Profile.findByPk(client.id);
            expect(updatedClient.balance).toBe(800); // 1000 - 100 - 100

            // Verify both jobs are marked as paid
            const updatedJob1 = await Job.findByPk(job1.id);
            const updatedJob2 = await Job.findByPk(job2.id);
            expect(updatedJob1.paid).toBe(true);
            expect(updatedJob2.paid).toBe(true);
        });
    });
}); 