const express = require('express');
const couponController = require('../controllers/couponController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/coupon/apply
 * @desc    Apply a coupon at checkout (increments usage count)
 * @access  Public
 */
router.post('/apply', couponController.applyCoupon);

/**
 * @route   POST /api/coupon/validate
 * @desc    Validate a coupon without incrementing usage count
 * @access  Public
 */
router.post('/validate', couponController.validateCoupon);

/**
 * @route   GET /api/coupon/active
 * @desc    Get all active coupons (public endpoint)
 * @access  Public
 */
router.get('/active', couponController.getActiveCoupons);

/**
 * @route   GET /api/coupon/status
 * @desc    Check coupon status by code
 * @access  Public
 */
router.get('/status', couponController.checkCouponStatus);

/**
 * @route   GET /api/coupon/:code
 * @desc    Get coupon details by code
 * @access  Public
 */
router.get('/:code', couponController.getCouponByCode);

module.exports = router;
