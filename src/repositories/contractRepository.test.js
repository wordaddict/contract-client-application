const { sequelize } = require('../models');
const contractRepository = require('./contractRepository');
const { Profile, Contract } = require('../models');

describe('ContractRepository', () => {
    let clientProfile;
    let contractorProfile;
    let otherProfile;
    let contract1;
    let contract2;
    let terminatedContract;

    // Ensure we're using test environment
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        
        // Drop and recreate all tables
        await sequelize.sync({ force: true });
    });

    // Clean up after all tests
    afterAll(async () => {
        try {
            // Drop all tables
            await sequelize.drop();
            // Close the connection
            await sequelize.close();
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    });

    // Set up fresh data for each test
    beforeEach(async () => {
        try {
            // Create test profiles
            clientProfile = await Profile.create({
                firstName: 'Test',
                lastName: 'Client',
                profession: 'Client',
                balance: 1000,
                type: 'client'
            });

            contractorProfile = await Profile.create({
                firstName: 'Test',
                lastName: 'Contractor',
                profession: 'Developer',
                balance: 0,
                type: 'contractor'
            });

            otherProfile = await Profile.create({
                firstName: 'Other',
                lastName: 'User',
                profession: 'Designer',
                balance: 0,
                type: 'contractor'
            });

            // Create test contracts
            contract1 = await Contract.create({
                terms: 'Test contract 1',
                status: 'in_progress',
                ClientId: clientProfile.id,
                ContractorId: contractorProfile.id
            });

            contract2 = await Contract.create({
                terms: 'Test contract 2',
                status: 'new',
                ClientId: clientProfile.id,
                ContractorId: contractorProfile.id
            });

            terminatedContract = await Contract.create({
                terms: 'Terminated contract',
                status: 'terminated',
                ClientId: clientProfile.id,
                ContractorId: contractorProfile.id
            });
        } catch (error) {
            console.error('Error during test setup:', error);
            throw error;
        }
    });

    // Clean up after each test
    afterEach(async () => {
        try {
            // Delete all data but keep tables
            await Contract.destroy({ where: {}, force: true });
            await Profile.destroy({ where: {}, force: true });
        } catch (error) {
            console.error('Error during test cleanup:', error);
            throw error;
        }
    });

    describe('findById', () => {
        it('should return contract when it exists', async () => {
            const contract = await contractRepository.findById(contract1.id);
            
            expect(contract).toBeDefined();
            expect(contract.id).toBe(contract1.id);
            expect(contract.terms).toBe(contract1.terms);
            expect(contract.status).toBe(contract1.status);
        });

        it('should return null when contract does not exist', async () => {
            const contract = await contractRepository.findById(99999);
            
            expect(contract).toBeNull();
        });
    });

    describe('findByProfileId', () => {
        it('should return all non-terminated contracts for a client', async () => {
            const contracts = await contractRepository.findByProfileId(clientProfile.id);
            
            expect(contracts).toHaveLength(2);
            expect(contracts.every(c => c.status !== 'terminated')).toBe(true);
            expect(contracts.every(c => c.ClientId === clientProfile.id)).toBe(true);
        });

        it('should return all non-terminated contracts for a contractor', async () => {
            const contracts = await contractRepository.findByProfileId(contractorProfile.id);
            
            expect(contracts).toHaveLength(2);
            expect(contracts.every(c => c.status !== 'terminated')).toBe(true);
            expect(contracts.every(c => c.ContractorId === contractorProfile.id)).toBe(true);
        });

        it('should return empty array for profile with no contracts', async () => {
            const contracts = await contractRepository.findByProfileId(otherProfile.id);
            
            expect(contracts).toHaveLength(0);
        });

        it('should not return terminated contracts', async () => {
            const contracts = await contractRepository.findByProfileId(clientProfile.id);
            
            expect(contracts.find(c => c.id === terminatedContract.id)).toBeUndefined();
        });
    });
}); 