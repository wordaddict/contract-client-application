const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { getProfile } = require('../middleware/getProfile');

router.get('/:id', getProfile, contractController.getContractById);
router.get('/', getProfile, contractController.getContracts);

module.exports = router; 