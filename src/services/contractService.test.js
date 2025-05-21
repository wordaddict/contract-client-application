const contractService = require('./contractService');
const contractRepository = require('../repositories/contractRepository');

// Mock the repository
jest.mock('../repositories/contractRepository');

describe('ContractService', () => {
    let mockContract;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Setup mock contract
        mockContract = {
            id: 1,
            terms: 'Test contract terms',
            status: 'in_progress',
            ClientId: 1,
            ContractorId: 2
        };
    });

    describe('getContractById', () => {
        it('should return null when contract does not exist', async () => {
            contractRepository.findById.mockResolvedValue(null);
            
            const result = await contractService.getContractById(999, 1);
            
            expect(result).toBeNull();
            expect(contractRepository.findById).toHaveBeenCalledWith(999);
        });

        it('should return null when user is not associated with the contract', async () => {
            contractRepository.findById.mockResolvedValue(mockContract);
            
            const result = await contractService.getContractById(1, 999);
            
            expect(result).toBeNull();
            expect(contractRepository.findById).toHaveBeenCalledWith(1);
        });

        it('should return contract when user is the client', async () => {
            contractRepository.findById.mockResolvedValue(mockContract);
            
            const result = await contractService.getContractById(1, 1);
            
            expect(result).toEqual(mockContract);
            expect(contractRepository.findById).toHaveBeenCalledWith(1);
        });

        it('should return contract when user is the contractor', async () => {
            contractRepository.findById.mockResolvedValue(mockContract);
            
            const result = await contractService.getContractById(1, 2);
            
            expect(result).toEqual(mockContract);
            expect(contractRepository.findById).toHaveBeenCalledWith(1);
        });
    });

    describe('getContractsByProfileId', () => {
        it('should return contracts for a profile', async () => {
            const mockContracts = [mockContract];
            contractRepository.findByProfileId.mockResolvedValue(mockContracts);
            
            const result = await contractService.getContractsByProfileId(1);
            
            expect(result).toEqual(mockContracts);
            expect(contractRepository.findByProfileId).toHaveBeenCalledWith(1);
        });
    });
}); 