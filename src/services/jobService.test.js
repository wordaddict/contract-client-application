const { Profile, Contract, Job } = require('../models');
const { sequelize } = require('../models');
const jobService = require('./jobService');
const cacheService = require('./cacheService');

describe('JobService', () => {
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
        // Clear cache before each test
        cacheService.clear();

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
        cacheService.clear();
    });

    afterAll(async () => {
        // Close database connection
        await sequelize.close();
    });

    describe('getUnpaidJobs', () => {
        it('should return unpaid jobs for client', async () => {
            const jobs = await jobService.getUnpaidJobs(clientProfile.id);
            
            expect(Array.isArray(jobs)).toBe(true);
            expect(jobs.length).toBe(1);
            expect(jobs[0].id).toBe(job.id);
            expect(jobs[0].paid).toBe(false);
        });

        it('should return unpaid jobs for contractor', async () => {
            const jobs = await jobService.getUnpaidJobs(contractorProfile.id);
            
            expect(Array.isArray(jobs)).toBe(true);
            expect(jobs.length).toBe(1);
            expect(jobs[0].id).toBe(job.id);
            expect(jobs[0].paid).toBe(false);
        });

        it('should not return jobs from terminated contracts', async () => {
            await contract.update({ status: 'terminated' });
            
            const jobs = await jobService.getUnpaidJobs(clientProfile.id);
            
            expect(Array.isArray(jobs)).toBe(true);
            expect(jobs.length).toBe(0);
        });

        it('should not return paid jobs', async () => {
            await job.update({ paid: true });
            
            const jobs = await jobService.getUnpaidJobs(clientProfile.id);
            
            expect(Array.isArray(jobs)).toBe(true);
            expect(jobs.length).toBe(0);
        });

        it('should cache results', async () => {
            const cacheKey = `unpaid_jobs:${clientProfile.id}`;
            
            // First call should hit the database
            await jobService.getUnpaidJobs(clientProfile.id);
            
            // Verify cache was set
            const cachedJobs = cacheService.get(cacheKey);
            expect(cachedJobs).toBeDefined();
            expect(Array.isArray(cachedJobs)).toBe(true);
            expect(cachedJobs.length).toBe(1);
        });

        it('should use cached results on subsequent calls', async () => {
            const cacheKey = `unpaid_jobs:${clientProfile.id}`;
            
            // First call to populate cache
            await jobService.getUnpaidJobs(clientProfile.id);
            
            // Create new unpaid job
            await Job.create({
                description: 'New job',
                price: 200,
                paid: false,
                ContractId: contract.id
            });
            
            // Second call should return cached version
            const jobs = await jobService.getUnpaidJobs(clientProfile.id);
            expect(jobs.length).toBe(1); // Should be old count from cache
        });
    });
}); 