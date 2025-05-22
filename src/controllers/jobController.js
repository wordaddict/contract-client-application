const jobService = require('../services/jobService');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../utils/errors');

/**
 * Get all unpaid jobs for a user (client or contractor) for active contracts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUnpaidJobs = async (req, res) => {
    try {
        const profileId = req.profile.id;
        const jobs = await jobService.getUnpaidJobs(profileId);
        
        res.json({
            status: 'success',
            message: jobs.length > 0 ? 'Unpaid jobs retrieved successfully' : 'No unpaid jobs found',
            data: jobs
        });
    } catch (error) {
        console.error('Error in getUnpaidJobs:', error);
        res.status(error instanceof UnauthorizedError ? 401 : 500).json({
            status: 'error',
            message: error.message,
            data: null
        });
    }
};

/**
 * Pay for a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const payForJob = async (req, res) => {
    try {
        const { job_id } = req.params;
        const profileId = req.profile.id;
        
        const result = await jobService.payForJob(job_id, profileId);
        
        res.json({
            status: 'success',
            message: 'Payment processed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in payForJob:', error);
        
        let status = 500;
        if (error instanceof NotFoundError) status = 404;
        if (error instanceof UnauthorizedError) status = 401;
        if (error instanceof BadRequestError) status = 400;
        
        res.status(status).json({
            status: 'error',
            message: error.message,
            data: null
        });
    }
};

module.exports = {
    getUnpaidJobs,
    payForJob
}; 