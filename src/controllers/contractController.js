const contractService = require('../services/contractService');

class ContractController {
    async getContractById(req, res) {
        try {
            if (!req.profile) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
            }

            const { id } = req.params;
            const profileId = req.profile.id;

            const contract = await contractService.getContractById(id, profileId);

            res.json({
                status: 'success',
                data: { contract }
            });
        } catch (error) {
            console.error('Error in getContractById:', error);
            
            if (error.message === 'Contract not found') {
                return res.status(404).json({
                    status: 'error',
                    message: error.message
                });
            }

            if (error.message === 'Unauthorized access to contract') {
                return res.status(403).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }

    async getContracts(req, res) {
        try {
            if (!req.profile) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
            }

            const profileId = req.profile.id;
            const contracts = await contractService.getContractsByProfileId(profileId);

            res.json({
                status: 'success',
                data: {
                    contracts,
                    count: contracts.length
                }
            });
        } catch (error) {
            console.error('Error in getContracts:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }
}

module.exports = new ContractController(); 