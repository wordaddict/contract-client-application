const { Profile, Contract, Job } = require('../models');
const { sequelize } = require('../models');
const { depositBalance, getBestProfession, getBestClients } = require('./profileController');
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
                data: expect.objectContaining({
                    id: clientProfile.id,
                    balance: 1200 // Initial 1000 + 200 deposit
                })
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

    describe('getBestProfession', () => {
        let programmerProfile;
        let designerProfile;
        let programmerContract;
        let designerContract;
        let programmerJob;
        let designerJob;
        let req;
        let res;

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

            // Mock request and response objects
            req = {
                query: {
                    start: '2024-01-01',
                    end: '2024-12-31'
                }
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };
        });

        it('should return best profession data if profile is an admin', async () => {
            req.profile = {
                type: 'admin'
            };

            await getBestProfession(req, res);

            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: {
                    profession: 'Programmer',
                    totalEarnings: 1000
                }
            });
        });

        it('should return 400 for missing dates', async () => {
            req.profile = {
                type: 'admin'
            };
            req.query = {};

            await getBestProfession(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Start and end dates are required',
                data: null
            });
        });

        it('should return 400 for invalid date range', async () => {
            req.profile = {
                type: 'admin'
            };
            req.query = {
                start: '2024-12-31',
                end: '2024-01-01'
            };

            await getBestProfession(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Start date must be before end date',
                data: null
            });
        });

        it('should return null profession when no jobs found', async () => {
            req.profile = {
                type: 'admin'
            };
            req.query = {
                start: '2023-01-01',
                end: '2023-12-31'
            };

            await getBestProfession(req, res);

            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: {
                    profession: null,
                    totalEarnings: 0
                }
            });
        });

        it('should handle server errors', async () => {
            req.profile = {
                type: 'admin'
            };
            // Simulate a server error by passing invalid dates
            req.query = {
                start: 'invalid-date',
                end: 'invalid-date'
            };

            await getBestProfession(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Internal server error',
                data: null
            });
        });
    });

    describe('getBestClients', () => {
        let client1;
        let client2;
        let contractor1;
        let contractor2;
        let contract1;
        let contract2;
        let job1;
        let job2;
        let req;
        let res;

        beforeEach(async () => {
            // Create test profiles
            client1 = await Profile.create({
                firstName: 'Client',
                lastName: 'One',
                profession: 'Manager',
                balance: 1000,
                type: 'client'
            });

            client2 = await Profile.create({
                firstName: 'Client',
                lastName: 'Two',
                profession: 'Director',
                balance: 2000,
                type: 'client'
            });

            contractor1 = await Profile.create({
                firstName: 'Contractor',
                lastName: 'One',
                profession: 'Developer',
                balance: 0,
                type: 'contractor'
            });

            contractor2 = await Profile.create({
                firstName: 'Contractor',
                lastName: 'Two',
                profession: 'Designer',
                balance: 0,
                type: 'contractor'
            });

            // Create test contracts
            contract1 = await Contract.create({
                terms: 'Contract One',
                status: 'in_progress',
                ClientId: client1.id,
                ContractorId: contractor1.id
            });

            contract2 = await Contract.create({
                terms: 'Contract Two',
                status: 'in_progress',
                ClientId: client2.id,
                ContractorId: contractor2.id
            });

            // Create test jobs with different prices
            job1 = await Job.create({
                description: 'Job One',
                price: 1000,
                paid: true,
                paymentDate: '2024-01-15',
                ContractId: contract1.id
            });

            job2 = await Job.create({
                description: 'Job Two',
                price: 500,
                paid: true,
                paymentDate: '2024-01-15',
                ContractId: contract2.id
            });

            // Mock request and response objects
            req = {
                query: {
                    start: '2024-01-01',
                    end: '2024-12-31'
                },
                profile: {
                    type: 'admin'
                }
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };
        });

        it('should return best clients by payment amount', async () => {
            await getBestClients(req, res);

            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: [
                    {
                        id: client1.id,
                        fullName: 'Client One',
                        paid: 1000
                    },
                    {
                        id: client2.id,
                        fullName: 'Client Two',
                        paid: 500
                    }
                ]
            });
        });

        it('should respect the limit parameter', async () => {
            req.query.limit = 1;

            await getBestClients(req, res);

            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: [
                    {
                        id: client1.id,
                        fullName: 'Client One',
                        paid: 1000
                    }
                ]
            });
        });

        it('should return 400 for missing dates', async () => {
            req.query = {};

            await getBestClients(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Start and end dates are required',
                data: null
            });
        });

        it('should return 400 for invalid date range', async () => {
            req.query = {
                start: '2024-12-31',
                end: '2024-01-01'
            };

            await getBestClients(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Start date must be before end date',
                data: null
            });
        });

        it('should return empty array when no jobs found', async () => {
            req.query = {
                start: '2023-01-01',
                end: '2023-12-31'
            };

            await getBestClients(req, res);

            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                data: []
            });
        });

        it('should handle server errors', async () => {
            // Simulate a server error by passing invalid dates
            req.query = {
                start: 'invalid-date',
                end: 'invalid-date'
            };

            await getBestClients(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid date format',
                data: null
            });
        });
    });
}); 