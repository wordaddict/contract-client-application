const contractRepository = require('../repositories/contractRepository');

class ContractService {
    async getContractById(id, profileId) {
        if (!id || !profileId) {
            throw new Error('Contract ID and Profile ID are required');
        }

        const contract = await contractRepository.findById(id);
        
        if (!contract) {
            throw new Error('Contract not found');
        }

        if (contract.ClientId !== profileId && contract.ContractorId !== profileId) {
            throw new Error('Unauthorized access to contract');
        }

        return contract;
    }

    async getContractsByProfileId(profileId) {
        if (!profileId) {
            throw new Error('Profile ID is required');
        }

        return await contractRepository.findByProfileId(profileId);
    }
}

module.exports = new ContractService(); 