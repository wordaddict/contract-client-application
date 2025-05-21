const contractService = require('../services/contractService');

class ContractController {
    async getContractById(req, res) {
        const { id } = req.params;
        const profileId = req.profile.id;

        // This ensures that the contract belongs to the profile
        const contract = await contractService.getContractById(id, profileId);
        
        if (!contract) {
            return res.status(404).end();
        }

        res.json(contract);
    }

    async getContracts(req, res) {
        const profileId = req.profile.id;
        const contracts = await contractService.getContractsByProfileId(profileId);
        res.json(contracts);
    }
}

module.exports = new ContractController(); 