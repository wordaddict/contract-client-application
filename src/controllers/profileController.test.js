const { Profile, Contract, Job } = require('../models');
const { sequelize } = require('../models');
const { depositBalance } = require('./profileController');
const { BadRequestError } = require('../utils/errors');

describe('ProfileController', () => {
    let clientProfile;
    let contractorProfile;
    let contract;
    let job;
    let req;
    let res;

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

        // Mock request and response objects
        req = {
            params: { userId: clientProfile.id },
            body: { amount: 200 }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });

    afterEach(async () => {
        // Clean up test data
        await Job.destroy({ where: {} });
        await Contract.destroy({ where: {} });
        await Profile.destroy({ where: {} });
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Close database connection
        await sequelize.close();
    });

    describe('depositBalance', () => {
        it('should successfully deposit money within 25% limit', async () => {
            await depositBalance(req, res);

            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Deposit successful',
                data: {
                    id: clientProfile.id,
                    balance: 1200 // Initial 1000 + 200 deposit
                }
            });
        });

        it('should return 400 for invalid deposit amount', async () => {
            req.body.amount = -100;

            await depositBalance(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid deposit amount',
                data: null
            });
        });

        it('should return 400 when deposit exceeds 25% limit', async () => {
            req.body.amount = 300; // 30% of $1000 unpaid job

            await depositBalance(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: expect.stringContaining('Cannot deposit more than 25%'),
                data: null
            });
        });

        it('should return 500 for server errors', async () => {
            // Simulate a server error by passing invalid profile ID
            req.params.userId = 'invalid';

            await depositBalance(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Internal server error',
                data: null
            });
        });

        it('should handle missing amount in request body', async () => {
            req.body = {};

            await depositBalance(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid deposit amount',
                data: null
            });
        });
    });
}); 