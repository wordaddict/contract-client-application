const express = require('express');
const { depositBalance, getBestProfession, getBestClients } = require('../controllers/profileController');
const { getProfile } = require('../middleware/getProfile');
const isAdmin = require('../middleware/isAdmin');

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

/**
 * @api {get} /admin/best-profession Get best profession
 * @apiName GetBestProfession
 * @apiGroup Admin
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} profile_id Profile ID of the admin
 * 
 * @apiQuery {String} start Start date (YYYY-MM-DD)
 * @apiQuery {String} end End date (YYYY-MM-DD)
 * 
 * @apiSuccess {String} status Success status
 * @apiSuccess {Object} data Response data
 * @apiSuccess {String} data.profession Best earning profession
 * @apiSuccess {Number} data.totalEarnings Total earnings for the profession
 * 
 * @apiError (400) {String} status Error status
 * @apiError (400) {String} message Error message
 * @apiError (400) {null} data null
 * 
 * @apiError (401) {String} status Error status
 * @apiError (401) {String} message Authentication required
 * @apiError (401) {null} data null
 * 
 * @apiError (403) {String} status Error status
 * @apiError (403) {String} message Admin access required
 * @apiError (403) {null} data null
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": "error",
 *       "message": "Start and end dates are required",
 *       "data": null
 *     }
 */
router.get('/admin/best-profession', getProfile, isAdmin, getBestProfession);

/**
 * @api {get} /admin/best-clients Get best clients by payment amount
 * @apiName GetBestClients
 * @apiGroup Admin
 * @apiHeader {String} profile_id Profile ID
 * @apiParam {String} start Start date (YYYY-MM-DD)
 * @apiParam {String} end End date (YYYY-MM-DD)
 * @apiParam {Number} [limit=2] Number of clients to return
 * @apiSuccess {Object[]} data List of best clients
 * @apiError {Object} error Error message
 */
router.get('/admin/best-clients', getProfile, isAdmin, getBestClients);

module.exports = router; 