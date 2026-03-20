const AffiliateCoupon = require('../models/Coupon');
const emailService = require('../utils/sendEmail');
const validator = require('validator');

class AdminController {
  // Create affiliate coupon
  async createAffiliateCoupon(req, res) {
    try {
      const { code, discount, expiryDate, affiliateEmail } = req.body;

      // Validate required fields
      if (!code || !discount || !expiryDate || !affiliateEmail) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required: code, discount, expiryDate, affiliateEmail'
        });
      }

      // Validate email format
      if (!validator.isEmail(affiliateEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address'
        });
      }

      // Validate discount
      if (typeof discount !== 'number' || discount < 0 || discount > 100) {
        return res.status(400).json({
          success: false,
          error: 'Discount must be a number between 0 and 100'
        });
      }

      // Validate expiry date
      const expiryDateObj = new Date(expiryDate);
      if (isNaN(expiryDateObj.getTime()) || expiryDateObj <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Expiry date must be a valid future date'
        });
      }

      // Check if coupon code already exists
      const existingCoupon = await AffiliateCoupon.findOne({ 
        code: code.trim().toUpperCase() 
      });

      if (existingCoupon) {
        return res.status(409).json({
          success: false,
          error: 'Coupon code already exists. Please use a different code.'
        });
      }

      // Create new coupon
      const newCoupon = new AffiliateCoupon({
        code: code.trim().toUpperCase(),
        discount,
        expiryDate: expiryDateObj,
        affiliateEmail: affiliateEmail.toLowerCase().trim()
      });

      // Save coupon to database
      const savedCoupon = await newCoupon.save();

      // Send email to affiliate
      try {
        const emailSent = await emailService.sendAffiliateCouponEmail({
          affiliateEmail: savedCoupon.affiliateEmail,
          couponCode: savedCoupon.code,
          discount: savedCoupon.discount,
          expiryDate: savedCoupon.expiryDate
        });

        if (emailSent) {
          console.log(`✅ Affiliate coupon email sent to ${savedCoupon.affiliateEmail}`);
        } else {
          console.warn(`⚠️  Failed to send affiliate coupon email to ${savedCoupon.affiliateEmail}`);
        }
      } catch (emailError) {
        console.error('❌ Error sending affiliate email:', emailError);
        // Don't fail the coupon creation if email fails
      }

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Affiliate coupon created successfully',
        data: {
          id: savedCoupon._id,
          code: savedCoupon.code,
          discount: savedCoupon.discount,
          expiryDate: savedCoupon.expiryDate,
          affiliateEmail: savedCoupon.affiliateEmail,
          usageCount: savedCoupon.usageCount,
          createdAt: savedCoupon.createdAt,
          emailSent: true // We assume it was sent for user feedback
        }
      });

    } catch (error) {
      console.error('❌ Error creating affiliate coupon:', error);
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Coupon code already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error while creating coupon'
      });
    }
  }

  // Get all affiliate coupons
  async getAllAffiliateCoupons(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      
      // Build filter
      const filter = {};
      
      if (status === 'active') {
        filter.expiryDate = { $gt: new Date() };
      } else if (status === 'expired') {
        filter.expiryDate = { $lte: new Date() };
      }

      if (search) {
        filter.$or = [
          { code: { $regex: search, $options: 'i' } },
          { affiliateEmail: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const coupons = await AffiliateCoupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await AffiliateCoupon.countDocuments(filter);

      res.json({
        success: true,
        data: {
          coupons,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching affiliate coupons:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching coupons'
      });
    }
  }

  // Get single affiliate coupon
  async getAffiliateCoupon(req, res) {
    try {
      const { id } = req.params;

      const coupon = await AffiliateCoupon.findById(id);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Coupon not found'
        });
      }

      res.json({
        success: true,
        data: coupon
      });

    } catch (error) {
      console.error('❌ Error fetching affiliate coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching coupon'
      });
    }
  }

  // Update affiliate coupon
  async updateAffiliateCoupon(req, res) {
    try {
      const { id } = req.params;
      const { discount, expiryDate, affiliateEmail } = req.body;

      // Find existing coupon
      const coupon = await AffiliateCoupon.findById(id);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Coupon not found'
        });
      }

      // Validate and update fields
      const updateData = {};

      if (discount !== undefined) {
        if (typeof discount !== 'number' || discount < 0 || discount > 100) {
          return res.status(400).json({
            success: false,
            error: 'Discount must be a number between 0 and 100'
          });
        }
        updateData.discount = discount;
      }

      if (expiryDate !== undefined) {
        const expiryDateObj = new Date(expiryDate);
        if (isNaN(expiryDateObj.getTime()) || expiryDateObj <= new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Expiry date must be a valid future date'
          });
        }
        updateData.expiryDate = expiryDateObj;
      }

      if (affiliateEmail !== undefined) {
        if (!validator.isEmail(affiliateEmail)) {
          return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address'
          });
        }
        updateData.affiliateEmail = affiliateEmail.toLowerCase().trim();
      }

      // Update coupon
      const updatedCoupon = await AffiliateCoupon.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: updatedCoupon
      });

    } catch (error) {
      console.error('❌ Error updating affiliate coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while updating coupon'
      });
    }
  }

  // Delete affiliate coupon
  async deleteAffiliateCoupon(req, res) {
    try {
      const { id } = req.params;

      const coupon = await AffiliateCoupon.findByIdAndDelete(id);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Coupon not found'
        });
      }

      res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting affiliate coupon:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting coupon'
      });
    }
  }

  // Get coupon statistics
  async getCouponStats(req, res) {
    try {
      const totalCoupons = await AffiliateCoupon.countDocuments();
      const activeCoupons = await AffiliateCoupon.countDocuments({
        expiryDate: { $gt: new Date() }
      });
      const expiredCoupons = totalCoupons - activeCoupons;
      
      // Get top performing coupons
      const topCoupons = await AffiliateCoupon.find()
        .sort({ usageCount: -1 })
        .limit(5)
        .select('code usageCount affiliateEmail');

      // Get total usage
      const usageStats = await AffiliateCoupon.aggregate([
        {
          $group: {
            _id: null,
            totalUsage: { $sum: '$usageCount' },
            averageUsage: { $avg: '$usageCount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          totalCoupons,
          activeCoupons,
          expiredCoupons,
          totalUsage: usageStats[0]?.totalUsage || 0,
          averageUsage: usageStats[0]?.averageUsage || 0,
          topCoupons
        }
      });

    } catch (error) {
      console.error('❌ Error fetching coupon stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching statistics'
      });
    }
  }
}

module.exports = new AdminController();
