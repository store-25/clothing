const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

/**
 * @route   POST /api/admin/create-coupon
 * @desc    Create a new affiliate coupon
 * @access  Admin
 */
router.post('/create-coupon', adminController.createAffiliateCoupon);

/**
 * @route   GET /api/admin/coupons
 * @desc    Get all affiliate coupons with pagination and filtering
 * @access  Admin
 */
router.get('/coupons', adminController.getAllAffiliateCoupons);

/**
 * @route   GET /api/admin/coupons/:id
 * @desc    Get a single affiliate coupon by ID
 * @access  Admin
 */
router.get('/coupons/:id', adminController.getAffiliateCoupon);

/**
 * @route   PUT /api/admin/coupons/:id
 * @desc    Update an affiliate coupon
 * @access  Admin
 */
router.put('/coupons/:id', adminController.updateAffiliateCoupon);

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Delete an affiliate coupon
 * @access  Admin
 */
router.delete('/coupons/:id', adminController.deleteAffiliateCoupon);

/**
 * @route   GET /api/admin/coupons/stats
 * @desc    Get coupon statistics
 * @access  Admin
 */
router.get('/coupons/stats', adminController.getCouponStats);

module.exports = router;
