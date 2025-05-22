const { Job, Contract, Profile } = require('../models');
const { sequelize } = require('../models');
const { NotFoundError } = require('../utils/errors');
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

    // Helper method to clear job cache
    clearJobCache(profileId) {
        cacheService.delete(`unpaid_jobs:${profileId}`);
    }
}

module.exports = new JobService(); 