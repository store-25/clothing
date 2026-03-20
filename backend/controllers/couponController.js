const AffiliateCoupon = require('../models/Coupon');
const emailService = require('../utils/sendEmail');

class CouponController {
  // Apply coupon at checkout
  async applyCoupon(req, res) {
    try {
      const { code } = req.body;

      // Validate input
      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Coupon code is required'
        });
      }

      // Clean and normalize the code
      const cleanCode = code.trim().toUpperCase();

      // Find valid coupon
      const coupon = await AffiliateCoupon.findValidCoupon(cleanCode);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Invalid or expired coupon code'
        });
      }

      // Increment usage count
      const updatedCoupon = await AffiliateCoupon.findByIdAndUpdate(
        coupon._id,
        { $inc: { usageCount: 1 } },
        { new: true, runValidators: true }
      );

      // Send usage notification email to affiliate
      try {
        const emailSent = await emailService.sendCouponUsageEmail({
          affiliateEmail: updatedCoupon.affiliateEmail,
          couponCode: updatedCoupon.code,
          usageCount: updatedCoupon.usageCount
        });

        if (emailSent) {
          console.log(`✅ Coupon usage email sent to ${updatedCoupon.affiliateEmail}`);
        } else {
          console.warn(`⚠️  Failed to send coupon usage email to ${updatedCoupon.affiliateEmail}`);
        }
      } catch (emailError) {
        console.error('❌ Error sending coupon usage email:', emailError);
        // Don't fail the coupon application if email fails
      }

      // Return success response with discount details
      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          code: updatedCoupon.code,
          discount: updatedCoupon.discount,
          discountType: 'percentage', // Always percentage for affiliate coupons
          usageCount: updatedCoupon.usageCount,
          expiryDate: updatedCoupon.expiryDate
        }
      });

    } catch (error) {
      console.error('❌ Error applying coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while applying coupon'
      });
    }
  }

  // Validate coupon without incrementing usage
  async validateCoupon(req, res) {
    try {
      const { code } = req.body;

      // Validate input
      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Coupon code is required'
        });
      }

      // Clean and normalize the code
      const cleanCode = code.trim().toUpperCase();

      // Find valid coupon
      const coupon = await AffiliateCoupon.findValidCoupon(cleanCode);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Invalid or expired coupon code'
        });
      }

      // Return coupon details without incrementing usage
      res.json({
        success: true,
        message: 'Coupon is valid',
        data: {
          code: coupon.code,
          discount: coupon.discount,
          discountType: 'percentage',
          usageCount: coupon.usageCount,
          expiryDate: coupon.expiryDate,
          isValid: true
        }
      });

    } catch (error) {
      console.error('❌ Error validating coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating coupon'
      });
    }
  }

  // Get coupon details by code
  async getCouponByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Coupon code is required'
        });
      }

      // Clean and normalize the code
      const cleanCode = code.trim().toUpperCase();

      // Find coupon (including expired ones for admin purposes)
      const coupon = await AffiliateCoupon.findOne({ code: cleanCode });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Coupon not found'
        });
      }

      // Check if coupon is expired
      const isExpired = coupon.expiryDate < new Date();

      res.json({
        success: true,
        data: {
          code: coupon.code,
          discount: coupon.discount,
          discountType: 'percentage',
          usageCount: coupon.usageCount,
          expiryDate: coupon.expiryDate,
          affiliateEmail: coupon.affiliateEmail,
          createdAt: coupon.createdAt,
          isExpired
        }
      });

    } catch (error) {
      console.error('❌ Error fetching coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching coupon'
      });
    }
  }

  // Get all active coupons (public endpoint)
  async getActiveCoupons(req, res) {
    try {
      const { limit = 10, skip = 0 } = req.query;

      // Find only active, non-expired coupons
      const coupons = await AffiliateCoupon.find({
        expiryDate: { $gt: new Date() }
      })
        .select('code discount expiryDate usageCount createdAt') // Exclude affiliate email for privacy
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await AffiliateCoupon.countDocuments({
        expiryDate: { $gt: new Date() }
      });

      res.json({
        success: true,
        data: {
          coupons,
          pagination: {
            total,
            limit: parseInt(limit),
            skip: parseInt(skip),
            hasMore: total > (parseInt(skip) + parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching active coupons:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching coupons'
      });
    }
  }

  // Check coupon status
  async checkCouponStatus(req, res) {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Coupon code is required'
        });
      }

      // Clean and normalize the code
      const cleanCode = code.trim().toUpperCase();

      // Find coupon
      const coupon = await AffiliateCoupon.findOne({ code: cleanCode });

      if (!coupon) {
        return res.json({
          success: true,
          data: {
            exists: false,
            message: 'Coupon code does not exist'
          }
        });
      }

      // Check status
      const isExpired = coupon.expiryDate < new Date();
      const isValid = !isExpired;

      res.json({
        success: true,
        data: {
          exists: true,
          isValid,
          isExpired,
          discount: coupon.discount,
          usageCount: coupon.usageCount,
          expiryDate: coupon.expiryDate,
          message: isValid ? 'Coupon is valid and active' : 'Coupon has expired'
        }
      });

    } catch (error) {
      console.error('❌ Error checking coupon status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while checking coupon status'
      });
    }
  }
}

module.exports = new CouponController();
