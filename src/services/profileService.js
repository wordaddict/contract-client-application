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
        if (!amount || amount <= 0) {
            throw new BadRequestError('Invalid deposit amount');
        }

        const profile = await Profile.findByPk(userId);
        if (!profile) {
            throw new NotFoundError('Profile not found');
        }

        if (profile.type !== 'client') {
            throw new BadRequestError('Only clients can deposit money');
        }

        // Get total unpaid jobs amount
        const unpaidJobs = await Job.findAll({
            include: [{
                model: Contract,
                where: {
                    ClientId: userId,
                    status: 'in_progress'
                }
            }],
            where: {
                paid: false
            }
        });

        const totalUnpaid = unpaidJobs.reduce((sum, job) => sum + job.price, 0);
        const maxDeposit = totalUnpaid * 0.25;

        // If there are no unpaid jobs, allow any deposit amount
        if (totalUnpaid === 0) {
            profile.balance += amount;
            await profile.save();
            return profile;
        }

        if (amount > maxDeposit) {
            throw new BadRequestError(`Cannot deposit more than 25% of total unpaid jobs (${maxDeposit})`);
        }

        profile.balance += amount;
        await profile.save();

        return profile;
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

    /**
     * Get best clients by payment amount
     */
    async getBestClients(start, end, limit = 2) {
        if (!start || !end) {
            throw new BadRequestError('Start and end dates are required');
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new BadRequestError('Invalid date format');
        }

        if (startDate > endDate) {
            throw new BadRequestError('Start date must be before end date');
        }

        const result = await Job.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('price')), 'paid']
            ],
            include: [{
                model: Contract,
                include: [{
                    model: Profile,
                    as: 'Client',
                    attributes: ['id', 'firstName', 'lastName']
                }]
            }],
            where: {
                paid: true,
                paymentDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: ['Contract.Client.id'],
            order: [[sequelize.fn('SUM', sequelize.col('price')), 'DESC']],
            limit: limit
        });

        return result.map(job => ({
            id: job.Contract.Client.id,
            fullName: `${job.Contract.Client.firstName} ${job.Contract.Client.lastName}`,
            paid: parseInt(job.getDataValue('paid'))
        }));
    }
}

module.exports = new ProfileService(); 