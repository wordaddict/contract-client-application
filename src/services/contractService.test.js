const { Profile, Contract } = require('../models');
const { sequelize } = require('../models');
const contractService = require('./contractService');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');

describe('ContractService', () => {
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

    describe('getContractById', () => {
        it('should throw NotFoundError when contract does not exist', async () => {
            await expect(contractService.getContractById(999, clientProfile.id))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw UnauthorizedError when user is not associated with the contract', async () => {
            const otherProfile = await Profile.create({
                firstName: 'Other',
                lastName: 'User',
                profession: 'Designer',
                balance: 0,
                type: 'client'
            });

            await expect(contractService.getContractById(contract.id, otherProfile.id))
                .rejects
                .toThrow(UnauthorizedError);
        });

        it('should return contract when user is the client', async () => {
            const result = await contractService.getContractById(contract.id, clientProfile.id);
            expect(result).toBeDefined();
            expect(result.id).toBe(contract.id);
            expect(result.ClientId).toBe(clientProfile.id);
            expect(result.ContractorId).toBe(contractorProfile.id);
        });

        it('should return contract when user is the contractor', async () => {
            const result = await contractService.getContractById(contract.id, contractorProfile.id);
            expect(result).toBeDefined();
            expect(result.id).toBe(contract.id);
            expect(result.ClientId).toBe(clientProfile.id);
            expect(result.ContractorId).toBe(contractorProfile.id);
        });
    });

    describe('getContracts', () => {
        it('should return contracts for a profile', async () => {
            const result = await contractService.getContracts(clientProfile.id);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(contract.id);
        });

        it('should return empty array when profile has no contracts', async () => {
            const otherProfile = await Profile.create({
                firstName: 'Other',
                lastName: 'User',
                profession: 'Designer',
                balance: 0,
                type: 'client'
            });

            const result = await contractService.getContracts(otherProfile.id);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('should only return non-terminated contracts', async () => {
            // Create a terminated contract
            await Contract.create({
                terms: 'Terminated contract',
                status: 'terminated',
                ClientId: clientProfile.id,
                ContractorId: contractorProfile.id
            });

            const result = await contractService.getContracts(clientProfile.id);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1);
            expect(result[0].status).not.toBe('terminated');
        });
    });
}); 