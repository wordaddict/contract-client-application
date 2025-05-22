const { Profile, Contract, Job } = require('../models');
const { sequelize } = require('../models');
const profileService = require('./profileService');
const { NotFoundError, BadRequestError } = require('../utils/errors');

describe('ProfileService', () => {
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
            price: 1000, // $1000 unpaid job
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

    describe('depositBalance', () => {
        it('should successfully deposit money within 25% limit', async () => {
            const depositAmount = 200; // 20% of $1000 unpaid job
            const updatedProfile = await profileService.depositBalance(clientProfile.id, depositAmount);
            
            expect(updatedProfile.balance).toBe(1200); // Initial 1000 + 200 deposit
        });

        it('should throw BadRequestError when deposit exceeds 25% of unpaid jobs', async () => {
            const depositAmount = 300; // 30% of $1000 unpaid job
            
            await expect(profileService.depositBalance(clientProfile.id, depositAmount))
                .rejects
                .toThrow(BadRequestError);
            
            // Verify balance wasn't changed
            const profile = await Profile.findByPk(clientProfile.id);
            expect(profile.balance).toBe(1000);
        });

        it('should throw NotFoundError when profile does not exist', async () => {
            await expect(profileService.depositBalance(999, 100))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw BadRequestError when profile is not a client', async () => {
            await expect(profileService.depositBalance(contractorProfile.id, 100))
                .rejects
                .toThrow(BadRequestError);
        });

        it('should handle multiple unpaid jobs correctly', async () => {
            // Create another unpaid job
            await Job.create({
                description: 'Another test job',
                price: 2000, // $2000 unpaid job
                paid: false,
                ContractId: contract.id
            });

            // Total unpaid: $3000, 25% = $750
            const depositAmount = 700; // Just under 25%
            const updatedProfile = await profileService.depositBalance(clientProfile.id, depositAmount);
            
            expect(updatedProfile.balance).toBe(1700); // Initial 1000 + 700 deposit
        });

        it('should handle zero unpaid jobs correctly', async () => {
            // Mark the job as paid
            await job.update({ paid: true });

            // Should be able to deposit any amount since there are no unpaid jobs
            const depositAmount = 1000;
            const updatedProfile = await profileService.depositBalance(clientProfile.id, depositAmount);
            
            expect(updatedProfile.balance).toBe(2000); // Initial 1000 + 1000 deposit
        });
    });

    describe('getBestProfession', () => {
        let programmerProfile;
        let designerProfile;
        let programmerContract;
        let designerContract;
        let programmerJob;
        let designerJob;

        beforeEach(async () => {
            // Create test profiles with different professions
            programmerProfile = await Profile.create({
                firstName: 'John',
                lastName: 'Doe',
                profession: 'Programmer',
                balance: 0,
                type: 'contractor'
            });

            designerProfile = await Profile.create({
                firstName: 'Jane',
                lastName: 'Smith',
                profession: 'Designer',
                balance: 0,
                type: 'contractor'
            });

            // Create test contracts
            programmerContract = await Contract.create({
                terms: 'Programming contract',
                status: 'in_progress',
                ClientId: clientProfile.id,
                ContractorId: programmerProfile.id
            });

            designerContract = await Contract.create({
                terms: 'Design contract',
                status: 'in_progress',
                ClientId: clientProfile.id,
                ContractorId: designerProfile.id
            });

            // Create test jobs with different prices
            programmerJob = await Job.create({
                description: 'Programming job',
                price: 1000,
                paid: true,
                paymentDate: '2024-01-15',
                ContractId: programmerContract.id
            });

            designerJob = await Job.create({
                description: 'Design job',
                price: 500,
                paid: true,
                paymentDate: '2024-01-15',
                ContractId: designerContract.id
            });
        });

        it('should return the profession with highest earnings', async () => {
            const result = await profileService.getBestProfession('2024-01-01', '2024-12-31');
            
            expect(result).toEqual({
                profession: 'Programmer',
                totalEarnings: 1000
            });
        });

        it('should return null profession when no jobs found', async () => {
            const result = await profileService.getBestProfession('2023-01-01', '2023-12-31');
            
            expect(result).toEqual({
                profession: null,
                totalEarnings: 0
            });
        });

        it('should throw BadRequestError when dates are missing', async () => {
            await expect(profileService.getBestProfession(null, '2024-12-31'))
                .rejects
                .toThrow(BadRequestError);
        });

        it('should throw BadRequestError when start date is after end date', async () => {
            await expect(profileService.getBestProfession('2024-12-31', '2024-01-01'))
                .rejects
                .toThrow(BadRequestError);
        });

        it('should sum up multiple jobs for the same profession', async () => {
            // Add another paid job for the programmer
            await Job.create({
                description: 'Another programming job',
                price: 2000,
                paid: true,
                paymentDate: '2024-01-15',
                ContractId: programmerContract.id
            });

            const result = await profileService.getBestProfession('2024-01-01', '2024-12-31');
            
            expect(result).toEqual({
                profession: 'Programmer',
                totalEarnings: 3000 // 1000 + 2000
            });
        });

        it('should only consider paid jobs', async () => {
            // Add an unpaid job for the programmer
            await Job.create({
                description: 'Unpaid programming job',
                price: 5000,
                paid: false,
                ContractId: programmerContract.id
            });

            const result = await profileService.getBestProfession('2024-01-01', '2024-12-31');
            
            expect(result).toEqual({
                profession: 'Programmer',
                totalEarnings: 1000 // Only the paid job is counted
            });
        });
    });
}); 