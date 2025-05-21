const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const contractRoutes = require('./routes/contractRoutes');

const app = express();

app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Routes
app.use('/contracts', contractRoutes);

module.exports = app;
