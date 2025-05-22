const express = require('express');
const { getUnpaidJobs, payForJob } = require('../controllers/jobController');
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

/**
 * @api {post} /jobs/:job_id/pay Pay for a job
 * @apiName PayForJob
 * @apiGroup Jobs
 * @apiHeader {Number} profile_id User's profile ID
 * @apiParam {Number} job_id Job ID
 * @apiSuccess {Object} job Updated job details
 * @apiSuccess {Number} job.id Job ID
 * @apiSuccess {String} job.description Job description
 * @apiSuccess {Number} job.price Job price
 * @apiSuccess {Boolean} job.paid Payment status
 * @apiSuccess {Date} job.paymentDate Payment date
 * @apiError (401) Unauthorized Invalid or missing profile_id
 * @apiError (404) NotFound Job not found
 * @apiError (400) BadRequest Job already paid or insufficient balance
 * @apiError (500) InternalServerError Server error
 */
router.post('/:job_id/pay', getProfile, payForJob);

module.exports = router; 