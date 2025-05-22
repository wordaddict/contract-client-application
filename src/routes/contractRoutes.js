const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { getProfile } = require('../middleware/getProfile');

// Apply authentication middleware to all routes
router.use(getProfile);

router.get('/:id', contractController.getContractById);
router.get('/', contractController.getContracts);

module.exports = router; 