const crypto = require('crypto');
const Razorpay = require('razorpay');

class PaymentService {
  static razorpay = null;

  // Initialize Razorpay instance
  static initialize() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET
    });
  }

  // Create Razorpay order
  static async createOrder(orderData) {
    try {
      const options = {
        amount: Math.round(orderData.final_amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          user_name: orderData.user_name,
          user_email: orderData.user_email,
          coupon_code: orderData.coupon_code || 'none'
        }
      };

      const order = await this.razorpay.orders.create(options);
      
      return {
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment order'
      };
    }
  }

  // Verify Razorpay payment signature
  static verifySignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      // Generate signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isValid = generatedSignature === razorpay_signature;
      
      if (!isValid) {
        console.warn('Payment verification failed - signature mismatch', {
          razorpay_order_id,
          razorpay_payment_id,
          received_signature: razorpay_signature,
          generated_signature
        });
      }

      return {
        success: isValid,
        valid: isValid,
        error: isValid ? null : 'Invalid payment signature'
      };
    } catch (error) {
      console.error('Signature verification error:', error);
      return {
        success: false,
        valid: false,
        error: 'Signature verification failed'
      };
    }
  }
}

module.exports = PaymentService;
