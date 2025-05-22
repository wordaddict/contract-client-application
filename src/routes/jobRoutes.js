const express = require('express');
const { getUnpaidJobs } = require('../controllers/jobController');
const { getProfile } = require('../middleware/getProfile');

const router = express.Router();

/**
 * @api {get} /jobs/unpaid Get unpaid jobs
 * @apiName GetUnpaidJobs
 * @apiGroup Jobs
 * @apiHeader {Number} profile_id User's profile ID
 * @apiSuccess {Object[]} jobs List of unpaid jobs
 * @apiSuccess {Number} jobs.id Job ID
 * @apiSuccess {String} jobs.description Job description
 * @apiSuccess {Number} jobs.price Job price
 * @apiSuccess {Boolean} jobs.paid Payment status
 * @apiSuccess {Date} jobs.paymentDate Payment date
 * @apiSuccess {Number} jobs.ContractId Associated contract ID
 * @apiError (401) Unauthorized Invalid or missing profile_id
 * @apiError (500) InternalServerError Server error
 */
router.get('/unpaid', getProfile, getUnpaidJobs);

module.exports = router; 