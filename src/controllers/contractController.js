const contractService = require('../services/contractService');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');

const getContractById = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await contractService.getContractById(id, req.profile.id);
        res.json(contract);
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
};

const getContracts = async (req, res) => {
    try {
        const contracts = await contractService.getContracts(req.profile.id);
        res.json(contracts);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getContractById,
    getContracts
}; 