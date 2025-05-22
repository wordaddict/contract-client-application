const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later'
    }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Strict transport security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Content security policy
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );

    next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].replace(/[<>]/g, '');
            }
        });
    }

    // Sanitize body parameters
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].replace(/[<>]/g, '');
            }
        });
    }

    // Sanitize URL parameters
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            if (typeof req.params[key] === 'string') {
                req.params[key] = req.params[key].replace(/[<>]/g, '');
            }
        });
    }

    next();
};

module.exports = {
    helmet,
    limiter,
    securityHeaders,
    sanitizeInput
}; 