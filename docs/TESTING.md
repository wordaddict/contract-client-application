# Testing Strategy

## Overview

The application implements a comprehensive testing strategy that includes unit tests, integration tests, and end-to-end tests. This document outlines the testing approach, test organization, and best practices for maintaining test quality.

## Test Types

### 1. Unit Tests

```javascript
// Example unit test for Profile model
describe('Profile Model', () => {
    it('should create a profile with valid data', async () => {
        const profile = await Profile.create({
            firstName: 'John',
            lastName: 'Doe',
            profession: 'Developer',
            balance: 1000,
            type: 'client'
        });

        expect(profile).toHaveProperty('id');
        expect(profile.firstName).toBe('John');
        expect(profile.type).toBe('client');
    });

    it('should validate required fields', async () => {
        await expect(Profile.create({})).rejects.toThrow();
    });
});
```

### 2. Integration Tests

```javascript
// Example integration test for contract endpoints
describe('Contract Endpoints', () => {
    it('should get contract by id', async () => {
        const response = await request(app)
            .get('/contracts/1')
            .set('profile_id', '1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without profile_id', async () => {
        const response = await request(app)
            .get('/contracts/1');

        expect(response.status).toBe(401);
    });
});
```

### 3. End-to-End Tests

```javascript
// Example E2E test for job payment flow
describe('Job Payment Flow', () => {
    it('should complete payment process', async () => {
        // Create test data
        const client = await Profile.create({
            firstName: 'Client',
            balance: 1000,
            type: 'client'
        });

        const job = await Job.create({
            description: 'Test job',
            price: 100,
            ContractId: 1
        });

        // Attempt payment
        const response = await request(app)
            .post(`/jobs/${job.id}/pay`)
            .set('profile_id', client.id);

        expect(response.status).toBe(200);
        
        // Verify job status
        const updatedJob = await Job.findByPk(job.id);
        expect(updatedJob.paid).toBe(true);
    });
});
```

## Test Organization

### 1. Directory Structure

```
__tests__/
├── unit/
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/
│   ├── controllers/
│   ├── middleware/
│   └── routes/
└── e2e/
    ├── flows/
    └── scenarios/
```

### 2. Test Setup

```javascript
// test/setup.js
const { sequelize } = require('../src/models');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
});
```

## Test Utilities

### 1. Test Helpers

```javascript
// test/helpers.js
const createTestProfile = async (type = 'client') => {
    return await Profile.create({
        firstName: 'Test',
        lastName: 'User',
        profession: 'Tester',
        balance: 1000,
        type
    });
};

const createTestContract = async (clientId, contractorId) => {
    return await Contract.create({
        terms: 'Test contract',
        status: 'new',
        ClientId: clientId,
        ContractorId: contractorId
    });
};
```

### 2. Mock Data

```javascript
// test/mocks.js
const mockProfiles = [
    {
        firstName: 'John',
        lastName: 'Doe',
        profession: 'Developer',
        balance: 1000,
        type: 'client'
    },
    {
        firstName: 'Jane',
        lastName: 'Smith',
        profession: 'Designer',
        balance: 2000,
        type: 'contractor'
    }
];

const mockContracts = [
    {
        terms: 'Contract 1',
        status: 'new',
        ClientId: 1,
        ContractorId: 2
    }
];
```

## Test Coverage

### 1. Coverage Configuration

```javascript
// jest.config.js
module.exports = {
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};
```

### 2. Coverage Reports

```bash
# Run tests with coverage
npm test -- --coverage

# Generate coverage report
npm run coverage:report
```

## Test Best Practices

### 1. Test Naming

```javascript
describe('Profile Controller', () => {
    it('should return 200 when profile exists', () => {
        // Test implementation
    });

    it('should return 404 when profile not found', () => {
        // Test implementation
    });
});
```

### 2. Test Isolation

```javascript
describe('Job Payment', () => {
    let client;
    let job;

    beforeEach(async () => {
        client = await createTestProfile('client');
        job = await createTestJob(client.id);
    });

    it('should process payment', async () => {
        // Test implementation
    });
});
```

## Performance Testing

### 1. Load Testing

```javascript
// test/performance/load.test.js
describe('API Performance', () => {
    it('should handle 100 concurrent requests', async () => {
        const requests = Array(100).fill().map(() => 
            request(app)
                .get('/contracts')
                .set('profile_id', '1')
        );

        const responses = await Promise.all(requests);
        const successCount = responses.filter(r => r.status === 200).length;
        expect(successCount).toBe(100);
    });
});
```

### 2. Response Time Testing

```javascript
// test/performance/response-time.test.js
describe('Response Times', () => {
    it('should respond within 200ms', async () => {
        const start = Date.now();
        await request(app)
            .get('/contracts')
            .set('profile_id', '1');
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(200);
    });
});
```
