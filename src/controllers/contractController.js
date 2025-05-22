const contractService = require('../services/contractService');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');

/**
 * Get a contract by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getContractById(req, res, next) {
    try {
        const { id } = req.params;
        const profileId = req.profile.id;
        const contract = await contractService.getContractById(id, profileId);
        
        res.json({
            status: 'success',
            message: 'Contract retrieved successfully',
            data: contract
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
        if (error instanceof UnauthorizedError) {
            return res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

/**
 * Get all contracts for a profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getContracts(req, res, next) {
    try {
        const profileId = req.profile.id;
        const contracts = await contractService.getContracts(profileId);
        
        res.json({
            status: 'success',
            message: contracts.length === 0 ? 'No contracts found' : 'Contracts retrieved successfully',
            data: contracts
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

module.exports = {
    getContractById,
    getContracts
}; 