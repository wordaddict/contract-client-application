const { BadRequestError } = require('../utils/errors');

/**
 * Middleware to check if the user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
    const profile = req.profile;

    if (!profile) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required',
            data: null
        });
    }

    if (profile.type !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required',
            data: null
        });
    }

    next();
};

module.exports = isAdmin; 