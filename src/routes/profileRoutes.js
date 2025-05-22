const express = require('express');
const { depositBalance } = require('../controllers/profileController');
const { getProfile } = require('../middleware/getProfile');

const router = express.Router();

/**
 * @api {post} /balances/deposit/:userId Deposit money into client's balance
 * @apiName DepositBalance
 * @apiGroup Profile
 * 
 * @apiHeader {String} profile_id Profile ID of the client
 * 
 * @apiParam {Number} userId Client's user ID
 * @apiBody {Number} amount Amount to deposit
 * 
 * @apiSuccess {String} status Success status
 * @apiSuccess {String} message Success message
 * @apiSuccess {Object} data Updated profile data
 * 
 * @apiError (400) {String} message Error message for invalid amount or exceeding 25% limit
 * @apiError (404) {String} message Error message for profile not found
 */
router.post('/balances/deposit/:userId', getProfile, depositBalance);

module.exports = router; 