const request = require('supertest');
const app = require('../app');
const { Profile, Contract } = require('../models');
const { sequelize } = require('../models');

describe('ContractController', () => {
    let clientProfile;
    let contractorProfile;
    let contract;

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
    });

    afterEach(async () => {
        // Clean up test data
        await Contract.destroy({ where: {} });
        await Profile.destroy({ where: {} });
    });

    afterAll(async () => {
        // Close database connection
        await sequelize.close();
    });

    describe('GET /contracts/:id', () => {
        it('should return contract for client', async () => {
            const response = await request(app)
                .get(`/contracts/${contract.id}`)
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.id).toBe(contract.id);
            expect(response.body.data.ClientId).toBe(clientProfile.id);
            expect(response.body.data.ContractorId).toBe(contractorProfile.id);
        });

        it('should return contract for contractor', async () => {
            const response = await request(app)
                .get(`/contracts/${contract.id}`)
                .set('profile_id', contractorProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.id).toBe(contract.id);
            expect(response.body.data.ClientId).toBe(clientProfile.id);
            expect(response.body.data.ContractorId).toBe(contractorProfile.id);
        });

        it('should return 404 for non-existent contract', async () => {
            const response = await request(app)
                .get('/contracts/999')
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('error');
        });

        it('should return 401 for unauthorized access', async () => {
            const otherProfile = await Profile.create({
                firstName: 'Other',
                lastName: 'User',
                profession: 'Tester',
                balance: 0,
                type: 'client'
            });

            const response = await request(app)
                .get(`/contracts/${contract.id}`)
                .set('profile_id', otherProfile.id);

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });

        it('should return 401 for missing authentication', async () => {
            const response = await request(app)
                .get(`/contracts/${contract.id}`);

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
    });

    describe('GET /contracts', () => {
        it('should return non-terminated contracts for client', async () => {
            const response = await request(app)
                .get('/contracts')
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].id).toBe(contract.id);
        });

        it('should return non-terminated contracts for contractor', async () => {
            const response = await request(app)
                .get('/contracts')
                .set('profile_id', contractorProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].id).toBe(contract.id);
        });

        it('should return empty array for user with no contracts', async () => {
            const otherProfile = await Profile.create({
                firstName: 'Other',
                lastName: 'User',
                profession: 'Tester',
                balance: 0,
                type: 'client'
            });

            const response = await request(app)
                .get('/contracts')
                .set('profile_id', otherProfile.id);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0);
        });

        it('should return 401 for missing authentication', async () => {
            const response = await request(app)
                .get('/contracts');

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
    });
}); 