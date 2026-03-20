const mongoose = require('mongoose');
const validator = require('validator');

const affiliateCouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters']
  },
  discount: {
    type: Number,
    required: [true, 'Discount amount is required'],
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  affiliateEmail: {
    type: String,
    required: [true, 'Affiliate email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(value) {
        return validator.isEmail(value);
      },
      message: 'Please provide a valid email address'
    }
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
affiliateCouponSchema.index({ code: 1 });
affiliateCouponSchema.index({ affiliateEmail: 1 });
affiliateCouponSchema.index({ expiryDate: 1 });

// Virtual for checking if coupon is expired
affiliateCouponSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Pre-save middleware to ensure code is uppercase
affiliateCouponSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Static method to find valid coupons
affiliateCouponSchema.statics.findValidCoupon = function(code) {
  return this.findOne({
    code: code.toUpperCase(),
    expiryDate: { $gt: new Date() }
  });
};

// Static method to find valid coupons
affiliateCouponSchema.statics.findValidCoupon = function(code) {
  return this.findOne({
    code: code.toUpperCase(),
    expiryDate: { $gt: new Date() }
  });
};

const AffiliateCoupon = mongoose.model('AffiliateCoupon', affiliateCouponSchema);

module.exports = AffiliateCoupon;
