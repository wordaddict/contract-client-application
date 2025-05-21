const contractRepository = require('../repositories/contractRepository');

class ContractService {
    async getContractById(id, profileId) {
        const contract = await contractRepository.findById(id);
        
        if (!contract) {
            return null;
        }

        // Check if the contract belongs to the profile
        if (contract.ClientId !== profileId && contract.ContractorId !== profileId) {
            return null;
        }

        return contract;
    }

    async getContractsByProfileId(profileId) {
        return await contractRepository.findByProfileId(profileId);
    }
}

module.exports = new ContractService(); 