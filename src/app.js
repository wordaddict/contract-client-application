const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const contractRoutes = require('./routes/contractRoutes');
const jobRoutes = require('./routes/jobRoutes');
const { helmet, limiter, securityHeaders, sanitizeInput } = require('./middleware/security');

const app = express();

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(securityHeaders); // Custom security headers
app.use(limiter); // Rate limiting
app.use(sanitizeInput); // Input sanitization

// Body parser with size limit
app.use(bodyParser.json({ limit: '10kb' })); // Limit payload size
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

// Set security-related headers
app.disable('x-powered-by'); // Remove X-Powered-By header

// Database setup
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Routes
app.use('/contracts', contractRoutes);
app.use('/jobs', jobRoutes);

// Error handling for unhandled routes
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        data: null
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        data: null
    });
});

module.exports = app;
