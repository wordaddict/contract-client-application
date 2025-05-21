const request = require('supertest');
const app = require('../app');
const { Profile, Contract } = require('../models');

describe('Contract Controller', () => {
    let clientProfile;
    let contractorProfile;
    let otherProfile;
    let contract1;
    let contract2;
    let terminatedContract;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await require('../models').sequelize.sync({ force: true });
    });

    beforeEach(async () => {
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
    });

    afterEach(async () => {
        await Contract.destroy({ where: {}, force: true });
        await Profile.destroy({ where: {}, force: true });
    });

    afterAll(async () => {
        await require('../models').sequelize.close();
    });

    describe('GET /contracts/:id', () => {
        it('should return contract when user is client', async () => {
            const response = await request(app)
                .get(`/contracts/${contract1.id}`)
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'success',
                data: {
                    contract: expect.objectContaining({
                        id: contract1.id,
                        terms: contract1.terms,
                        status: contract1.status
                    })
                }
            });
        });

        it('should return contract when user is contractor', async () => {
            const response = await request(app)
                .get(`/contracts/${contract1.id}`)
                .set('profile_id', contractorProfile.id);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'success',
                data: {
                    contract: expect.objectContaining({
                        id: contract1.id,
                        terms: contract1.terms,
                        status: contract1.status
                    })
                }
            });
        });

        it('should return 404 when contract does not exist', async () => {
            const response = await request(app)
                .get('/contracts/99999')
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                status: 'error',
                message: 'Contract not found'
            });
        });

        it('should return 403 when user is not associated with contract', async () => {
            const response = await request(app)
                .get(`/contracts/${contract1.id}`)
                .set('profile_id', otherProfile.id);

            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                status: 'error',
                message: 'Unauthorized access to contract'
            });
        });

        it('should return 401 when profile_id is not provided', async () => {
            const response = await request(app)
                .get(`/contracts/${contract1.id}`);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                status: 'error',
                message: 'Authentication required'
            });
        });
    });

    describe('GET /contracts', () => {
        it('should return non-terminated contracts for client', async () => {
            const response = await request(app)
                .get('/contracts')
                .set('profile_id', clientProfile.id);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'success',
                data: {
                    contracts: expect.arrayContaining([
                        expect.objectContaining({
                            id: contract1.id,
                            terms: contract1.terms,
                            status: contract1.status
                        }),
                        expect.objectContaining({
                            id: contract2.id,
                            terms: contract2.terms,
                            status: contract2.status
                        })
                    ]),
                    count: 2
                }
            });
            expect(response.body.data.contracts.find(c => c.id === terminatedContract.id)).toBeUndefined();
        });

        it('should return non-terminated contracts for contractor', async () => {
            const response = await request(app)
                .get('/contracts')
                .set('profile_id', contractorProfile.id);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'success',
                data: {
                    contracts: expect.arrayContaining([
                        expect.objectContaining({
                            id: contract1.id,
                            terms: contract1.terms,
                            status: contract1.status
                        }),
                        expect.objectContaining({
                            id: contract2.id,
                            terms: contract2.terms,
                            status: contract2.status
                        })
                    ]),
                    count: 2
                }
            });
            expect(response.body.data.contracts.find(c => c.id === terminatedContract.id)).toBeUndefined();
        });

        it('should return empty array for user with no contracts', async () => {
            const response = await request(app)
                .get('/contracts')
                .set('profile_id', otherProfile.id);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'success',
                data: {
                    contracts: [],
                    count: 0
                }
            });
        });

        it('should return 401 when profile_id is not provided', async () => {
            const response = await request(app)
                .get('/contracts');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                status: 'error',
                message: 'Authentication required'
            });
        });
    });
}); 