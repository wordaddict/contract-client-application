const jobService = require('../services/jobService');

/**
 * Get all unpaid jobs for a user (client or contractor) for active contracts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getUnpaidJobs(req, res, next) {
    try {
        const profileId = req.profile.id;
        const jobs = await jobService.getUnpaidJobs(profileId);
        
        res.json({
            status: 'success',
            message: jobs.length === 0 ? 'No unpaid jobs found' : 'Unpaid jobs retrieved successfully',
            data: jobs
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getUnpaidJobs
}; 