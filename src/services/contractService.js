const { Contract, Profile, sequelize } = require('../models');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');
const { Op } = require('sequelize');
const cacheService = require('./cacheService');

class ContractService {
    async getContractById(contractId, profileId) {
        const cacheKey = `contract:${contractId}:${profileId}`;
        const cachedContract = cacheService.get(cacheKey);
        
        if (cachedContract) {
            return cachedContract;
        }

        // Optimize query by selecting only needed fields
        const contract = await Contract.findOne({
            where: { id: contractId },
            attributes: ['id', 'terms', 'status', 'ClientId', 'ContractorId'],
            raw: true // Use raw queries for better performance
        });
        
        if (!contract) {
            throw new NotFoundError('Contract not found');
        }

        if (contract.ClientId !== profileId && contract.ContractorId !== profileId) {
            throw new UnauthorizedError('Unauthorized access to contract');
        }

        // Cache the result
        cacheService.set(cacheKey, contract);

        return contract;
    }

    async getContracts(profileId) {
        const cacheKey = `contracts:${profileId}`;
        const cachedContracts = cacheService.get(cacheKey);
        
        if (cachedContracts) {
            return cachedContracts;
        }

        // Optimize query by selecting only needed fields and using raw queries
        const contracts = await Contract.findAll({
            where: {
                [Op.or]: [
                    { ClientId: profileId },
                    { ContractorId: profileId }
                ],
                status: {
                    [Op.ne]: 'terminated'
                }
            },
            attributes: ['id', 'terms', 'status', 'ClientId', 'ContractorId'],
            raw: true,
            // Add index hint for better performance
            indexHints: [{ type: 'USE', values: ['idx_contract_status'] }]
        });

        // Cache the result
        cacheService.set(cacheKey, contracts);

        return contracts;
    }

    // Helper method to clear cache for a specific contract
    clearContractCache(contractId, profileId) {
        cacheService.delete(`contract:${contractId}:${profileId}`);
        cacheService.delete(`contracts:${profileId}`);
    }
}

module.exports = new ContractService(); 