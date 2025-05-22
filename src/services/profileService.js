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

    /**
     * Get the profession that earned the most money in a date range
     * 
     * @param {Date} startDate - Start date of the range
     * @param {Date} endDate - End date of the range
     * @returns {Promise<Object>} Object containing the best profession and total earnings
     * @throws {BadRequestError} If dates are invalid
     */
    async getBestProfession(startDate, endDate) {
        // Validate dates
        if (!startDate || !endDate) {
            throw new BadRequestError('Start and end dates are required');
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }

            if (start > end) {
                throw new BadRequestError('Start date must be before end date');
            }

            // Query to find the profession with highest earnings
            const result = await Job.findAll({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('price')), 'totalEarnings'],
                    [sequelize.col('Contract.Contractor.profession'), 'profession']
                ],
                include: [{
                    model: Contract,
                    required: true,
                    include: [{
                        model: Profile,
                        as: 'Contractor',
                        required: true,
                        attributes: ['profession']
                    }]
                }],
                where: {
                    paid: true,
                    paymentDate: {
                        [Op.between]: [start, end]
                    }
                },
                group: [sequelize.col('Contract.Contractor.profession')],
                order: [[sequelize.fn('SUM', sequelize.col('price')), 'DESC']],
                limit: 1
            });

            if (!result.length) {
                return {
                    profession: null,
                    totalEarnings: 0
                };
            }

            return {
                profession: result[0].getDataValue('profession'),
                totalEarnings: parseInt(result[0].getDataValue('totalEarnings'))
            };
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            throw new Error('Invalid date format');
        }
    }
}

module.exports = new ProfileService(); 