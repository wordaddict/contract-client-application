const { Job, Contract, Profile } = require('../models');
const { sequelize } = require('../models');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../utils/errors');
const cacheService = require('./cacheService');
const { Op } = require('sequelize');

class JobService {
    async getUnpaidJobs(profileId) {
        const cacheKey = `unpaid_jobs:${profileId}`;
        const cachedJobs = cacheService.get(cacheKey);
        
        if (cachedJobs) {
            return cachedJobs;
        }

        // Get all unpaid jobs for active contracts
        const jobs = await Job.findAll({
            include: [{
                model: Contract,
                where: {
                    status: 'in_progress',
                    [Op.or]: [
                        { ClientId: profileId },
                        { ContractorId: profileId }
                    ]
                },
                attributes: ['id', 'status', 'ClientId', 'ContractorId']
            }],
            where: {
                paid: false
            },
            attributes: ['id', 'description', 'price', 'paid', 'paymentDate', 'ContractId']
        });

        // Transform the results to ensure boolean values
        const transformedJobs = jobs.map(job => ({
            ...job.toJSON(),
            paid: Boolean(job.paid)
        }));

        // Cache the results
        cacheService.set(cacheKey, transformedJobs);

        return transformedJobs;
    }

    /**
     * Process payment for a job
     * 
     * Note on SQLite Transaction Handling:
     * - SQLite only supports SERIALIZABLE isolation level (default)
     * - Uses file-level locking: only one write transaction at a time
     * - See: https://www.sqlite.org/isolation.html
     * 
     * @param {number} jobId - The ID of the job to pay for
     * @param {number} profileId - The ID of the client making the payment
     * @returns {Promise<Object>} The updated job object
     * @throws {NotFoundError} If job doesn't exist
     * @throws {UnauthorizedError} If profile is not the client
     * @throws {BadRequestError} If job is already paid or insufficient balance
     */
    async payForJob(jobId, profileId) {
        // SQLite uses file-level locking, so we don't need to specify isolation level
        // as SERIALIZABLE is the only supported level
        const transaction = await sequelize.transaction();

        try {
            // Get job with contract and profiles
            // Using FOR UPDATE to lock the row (SQLite will lock the entire table)
            const job = await Job.findOne({
                where: { id: jobId },
                include: [{
                    model: Contract,
                    include: [
                        { model: Profile, as: 'Client' },
                        { model: Profile, as: 'Contractor' }
                    ]
                }],
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!job) {
                await transaction.rollback();
                throw new NotFoundError('Job not found');
            }

            // Verify the profile is the client of the contract
            if (job.Contract.ClientId !== profileId) {
                await transaction.rollback();
                throw new UnauthorizedError('Only the client can pay for a job');
            }

            // Check if job is already paid
            if (job.paid) {
                await transaction.rollback();
                throw new BadRequestError('Job is already paid');
            }

            // Get the latest client balance
            // Note: Due to SQLite's file-level locking, this will be atomic
            const client = await Profile.findOne({
                where: { id: job.Contract.ClientId },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            // Check if client has sufficient balance
            if (client.balance < job.price) {
                await transaction.rollback();
                throw new BadRequestError('Insufficient balance');
            }

            // Update balances and mark job as paid
            // All updates are atomic due to SQLite's file-level locking
            await Promise.all([
                Profile.update(
                    { balance: sequelize.literal(`balance - ${job.price}`) },
                    { 
                        where: { id: job.Contract.ClientId },
                        transaction 
                    }
                ),
                Profile.update(
                    { balance: sequelize.literal(`balance + ${job.price}`) },
                    { 
                        where: { id: job.Contract.ContractorId },
                        transaction 
                    }
                ),
                Job.update(
                    { 
                        paid: true,
                        paymentDate: new Date()
                    },
                    { 
                        where: { id: jobId },
                        transaction 
                    }
                )
            ]);

            // Clear relevant caches
            this.clearJobCache(job.Contract.ClientId);
            this.clearJobCache(job.Contract.ContractorId);

            await transaction.commit();

            return {
                id: job.id,
                paid: true,
                paymentDate: new Date(),
                price: job.price,
                description: job.description
            };
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    // Helper method to clear job cache
    clearJobCache(profileId) {
        cacheService.delete(`unpaid_jobs:${profileId}`);
    }
}

module.exports = new JobService(); 