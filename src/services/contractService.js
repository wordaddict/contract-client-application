const { Contract } = require('../models');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');
const { Op } = require('sequelize');

class ContractService {
    async getContractById(contractId, profileId) {
        const contract = await Contract.findOne({ where: { id: contractId } });
        
        if (!contract) {
            throw new NotFoundError('Contract not found');
        }

        if (contract.ClientId !== profileId && contract.ContractorId !== profileId) {
            throw new UnauthorizedError('Unauthorized access to contract');
        }

        return contract;
    }

    async getContracts(profileId) {
        return Contract.findAll({
            where: {
                [Op.or]: [
                    { ClientId: profileId },
                    { ContractorId: profileId }
                ],
                status: {
                    [Op.ne]: 'terminated'
                }
            }
        });
    }
}

module.exports = new ContractService(); 