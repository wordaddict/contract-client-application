const { Contract } = require('../models');
const { Op } = require('sequelize');

class ContractRepository {
    async findById(id) {
        if (!id) {
            throw new Error('Contract ID is required');
        }

        try {
            return await Contract.findOne({
                where: { id }
            });
        } catch (error) {
            throw new Error(`Error fetching contract: ${error.message}`);
        }
    }

    async findByProfileId(profileId) {
        if (!profileId) {
            throw new Error('Profile ID is required');
        }

        try {
            return await Contract.findAll({
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
        } catch (error) {
            throw new Error(`Error fetching contracts: ${error.message}`);
        }
    }
}

module.exports = new ContractRepository(); 