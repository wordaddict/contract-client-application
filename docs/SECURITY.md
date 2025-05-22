# Security Measures

## Overview

The application implements multiple layers of security measures to protect against common vulnerabilities and ensure data integrity. This document outlines the security measures in place and best practices for maintaining security.

## Authentication & Authorization

### 1. Profile ID Validation

```javascript
// Validate profile ID format
if (!/^\d+$/.test(profileId)) {
    throw new UnauthorizedError('Invalid profile ID format');
}

// Validate profile existence
const profile = await Profile.findOne({ 
    where: { id: profileId },
    attributes: ['id', 'firstName', 'lastName', 'profession', 'balance', 'type']
});

if (!profile) {
    throw new UnauthorizedError('Invalid profile ID');
}
```

### 2. Role-Based Access Control

```javascript
// Admin access check
if (profile.type !== 'admin') {
    return res.status(403).json({
        status: 'error',
        message: 'Admin access required',
        data: null
    });
}
```

## Input Validation

### 1. Request Parameters

```javascript
// Validate date format
const validateDate = (date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) {
        throw new BadRequestError('Invalid date format. Use YYYY-MM-DD');
    }
    return true;
};

// Validate numeric values
const validateNumeric = (value, field) => {
    if (isNaN(value) || value <= 0) {
        throw new BadRequestError(`Invalid ${field}. Must be a positive number`);
    }
    return true;
};
```

### 2. SQL Injection Prevention

```javascript
// Using Sequelize ORM for safe queries
const result = await Profile.findAll({
    where: {
        id: profileId // Automatically escaped
    },
    attributes: ['id', 'firstName', 'lastName'] // Explicit attribute selection
});
```

## Error Handling

### 1. Custom Error Classes

```javascript
class BadRequestError extends Error {
    constructor(message = 'Bad request') {
        super(message);
        this.name = 'BadRequestError';
        this.status = 400;
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
        this.status = 401;
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Forbidden access') {
        super(message);
        this.name = 'ForbiddenError';
        this.status = 403;
    }
}
```

### 2. Error Response Format

```javascript
// Consistent error response format
const errorResponse = (res, error) => {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    res.status(status).json({
        status: 'error',
        message,
        data: null
    });
};
```

## Rate Limiting

### 1. Implementation

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests, please try again later',
        data: null
    }
});

app.use(limiter);
```

### 2. Headers

```javascript
// Rate limit headers
res.set({
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': remaining,
    'X-RateLimit-Reset': reset
});
```

## Data Protection

### 1. Sensitive Data Handling

```javascript
// Exclude sensitive fields from responses
const profile = await Profile.findOne({
    where: { id: profileId },
    attributes: {
        exclude: ['password', 'secretKey']
    }
});
```

### 2. Data Validation

```javascript
// Validate deposit amount
const validateDeposit = (amount, balance) => {
    if (amount <= 0) {
        throw new BadRequestError('Deposit amount must be positive');
    }
    
    if (amount > balance * 0.25) {
        throw new BadRequestError('Deposit amount cannot exceed 25% of balance');
    }
    
    return true;
};
```

## Logging & Monitoring

### 1. Request Logging

```javascript
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
            ip: req.ip
        });
    });
    
    next();
};
```

### 2. Error Logging

```javascript
const errorLogger = (error, req, res, next) => {
    console.error({
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    
    next(error);
};
```

## Security Headers

### 1. Implementation

```javascript
const helmet = require('helmet');

app.use(helmet());
```

### 2. Custom Headers

```javascript
app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    });
    next();
});
```