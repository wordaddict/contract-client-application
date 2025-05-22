const { Profile } = require('../models');
const { UnauthorizedError } = require('../utils/errors');

const getProfile = async (req, res, next) => {
    try {
        const profileId = req.get('profile_id');
        
        if (!profileId) {
            throw new UnauthorizedError('Authentication required');
        }

        // Validate profile ID format
        if (!/^\d+$/.test(profileId)) {
            throw new UnauthorizedError('Invalid profile ID format');
        }

        const profile = await Profile.findOne({ 
            where: { id: profileId },
            attributes: ['id', 'firstName', 'lastName', 'profession', 'balance', 'type'] // Only select necessary fields
        });
        
        if (!profile) {
            throw new UnauthorizedError('Invalid profile ID');
        }

        // Add profile to request
        req.profile = profile;

        // Add request timestamp for tracking
        req.requestTimestamp = new Date();

        // Log authentication attempt
        console.log(`Authentication attempt for profile ${profileId} at ${req.requestTimestamp}`);

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
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
};

module.exports = { getProfile };