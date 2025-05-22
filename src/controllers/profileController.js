const profileService = require('../services/profileService');
const { BadRequestError } = require('../utils/errors');

/**
 * Deposit money into client's balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const depositBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid deposit amount',
                data: null
            });
        }

        const updatedProfile = await profileService.depositBalance(userId, amount);

        res.json({
            status: 'success',
            message: 'Deposit successful',
            data: {
                id: updatedProfile.id,
                balance: updatedProfile.balance
            }
        });
    } catch (error) {
        console.error('Error in depositBalance:', error);
        
        if (error instanceof BadRequestError) {
            return res.status(400).json({
                status: 'error',
                message: error.message,
                data: null
            });
        }

        // Handle any other errors as server errors
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            data: null
        });
    }
};

/**
 * Get the profession that earned the most money in a date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getBestProfession(req, res) {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({
                status: 'error',
                message: 'Start and end dates are required',
                data: null
            });
        }

        const result = await profileService.getBestProfession(start, end);

        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Error in getBestProfession:', error);
        
        if (error instanceof BadRequestError) {
            return res.status(400).json({
                status: 'error',
                message: error.message,
                data: null
            });
        }

        // Handle any other errors as server errors
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            data: null
        });
    }
}

module.exports = {
    depositBalance,
    getBestProfession
}; 