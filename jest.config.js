module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/'
    ],
    verbose: true
}; 