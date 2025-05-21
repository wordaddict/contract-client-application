const contractController = require('./contractController');
const contractService = require('../services/contractService');

// Mock the service
jest.mock('../services/contractService');

describe('ContractController', () => {
    let mockRequest;
    let mockResponse;
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

        // Setup mock request and response
        mockRequest = {
            params: { id: '1' },
            profile: { id: 1 }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            end: jest.fn()
        };
    });

    describe('getContractById', () => {
        it('should return 404 when contract does not exist', async () => {
            contractService.getContractById.mockResolvedValue(null);
            
            await contractController.getContractById(mockRequest, mockResponse);
            
            expect(contractService.getContractById).toHaveBeenCalledWith('1', 1);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.end).toHaveBeenCalled();
        });

        it('should return contract when it exists', async () => {
            contractService.getContractById.mockResolvedValue(mockContract);
            
            await contractController.getContractById(mockRequest, mockResponse);
            
            expect(contractService.getContractById).toHaveBeenCalledWith('1', 1);
            expect(mockResponse.json).toHaveBeenCalledWith(mockContract);
        });
    });

    describe('getContracts', () => {
        it('should return contracts for a profile', async () => {
            const mockContracts = [mockContract];
            contractService.getContractsByProfileId.mockResolvedValue(mockContracts);
            
            await contractController.getContracts(mockRequest, mockResponse);
            
            expect(contractService.getContractsByProfileId).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith(mockContracts);
        });
    });
}); 