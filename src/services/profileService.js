const { Profile, Job, Contract } = require('../models');
const { sequelize } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { Op } = require('sequelize');

class ProfileService {
    /**
     * Deposit money into a client's balance
     * Rule: Cannot deposit more than 25% of total unpaid jobs
     * 
     * @param {number} userId - The ID of the client
     * @param {number} amount - The amount to deposit
     * @returns {Promise<Object>} The updated profile
     * @throws {NotFoundError} If profile doesn't exist
     * @throws {BadRequestError} If amount exceeds 25% of unpaid jobs or profile is not a client
     */
    async depositBalance(userId, amount) {
        // Start transaction
        const transaction = await sequelize.transaction();

        try {
            // Get profile with lock to prevent concurrent deposits
            const profile = await Profile.findOne({
                where: { id: userId },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!profile) {
                await transaction.rollback();
                throw new NotFoundError('Profile not found');
            }

            // Check if profile is a client
            if (profile.type !== 'client') {
                await transaction.rollback();
                throw new BadRequestError('Only clients can deposit money');
            }

            // Calculate total of unpaid jobs
            const unpaidJobs = await Job.findAll({
                include: [{
                    model: Contract,
                    where: {
                        status: 'in_progress',
                        ClientId: userId
                    }
                }],
                where: {
                    paid: false
                },
                transaction
            });

            const totalUnpaid = unpaidJobs.reduce((sum, job) => sum + job.price, 0);
            
            // Only apply 25% limit if there are unpaid jobs
            if (totalUnpaid > 0) {
                const maxDeposit = totalUnpaid * 0.25;
                if (amount > maxDeposit) {
                    await transaction.rollback();
                    throw new BadRequestError(
                        `Cannot deposit more than 25% of total unpaid jobs (${maxDeposit})`
                    );
                }
            }

            // Update balance using literal to ensure atomicity
            await Profile.update(
                { balance: sequelize.literal(`balance + ${amount}`) },
                { 
                    where: { id: userId },
                    transaction 
                }
            );

            await transaction.commit();

            // Return updated profile
            return await Profile.findByPk(userId);
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }
}

module.exports = new ProfileService(); 