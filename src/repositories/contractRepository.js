const { Contract } = require('../models');
const { Op } = require('sequelize');

class ContractRepository {
    async findById(id) {
        return await Contract.findOne({ where: { id } });
    }

    async findByProfileId(profileId) {
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
    }
}

module.exports = new ContractRepository(); 