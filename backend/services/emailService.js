const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;

  static async initializeTransporter() {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ Email configuration missing in .env file');
        return false;
      }

      // Create transporter with Gmail (or other service)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      this.transporter = null;
      return false;
    }
  }

  static async sendEmail(to, subject, message) {
    try {
      if (!this.transporter) {
        console.log('⚠️ Email service not initialized');
        return { success: false, error: 'Email service not available' };
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: message
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendOrderConfirmation(orderData) {
    try {
      const { user_email, user_name, order_id, items, final_amount, shipping_address } = orderData;
      
      const subject = `Order Confirmation - ${order_id}`;
      
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Order Confirmation</h2>
          <p>Dear ${user_name},</p>
          <p>Thank you for your order! Your order has been confirmed and is being processed.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order_id}</p>
            <p><strong>Total Amount:</strong> ₹${final_amount}</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Items Ordered</h3>
            ${items.map(item => `
              <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                <p><strong>${item.product_name}</strong></p>
                <p>Quantity: ${item.quantity} | Price: ₹${item.price}</p>
                ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                ${item.color ? `<p>Color: ${item.color}</p>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
            <p>${shipping_address.street}</p>
            <p>${shipping_address.city}, ${shipping_address.state} ${shipping_address.pincode}</p>
            <p>Phone: ${shipping_address.phone}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">You can track your order status by contacting our customer support.</p>
          <p>Best regards,<br>STORE25 Team</p>
        </div>
      `;

      return await this.sendEmail(user_email, subject, message);
    } catch (error) {
      console.error('❌ Error sending order confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendOrderStatusUpdate(orderData) {
    try {
      const { user_email, user_name, order_id, order_status, notes } = orderData;
      
      const subject = `Order Status Update - ${order_id}`;
      
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Order Status Update</h2>
          <p>Dear ${user_name},</p>
          <p>Your order status has been updated.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Information</h3>
            <p><strong>Order ID:</strong> ${order_id}</p>
            <p><strong>Status:</strong> ${order_status.toUpperCase()}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>
          
          <p style="color: #666; font-size: 14px;">Thank you for shopping with STORE25!</p>
          <p>Best regards,<br>STORE25 Team</p>
        </div>
      `;

      return await this.sendEmail(user_email, subject, message);
    } catch (error) {
      console.error('❌ Error sending order status update:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendAffiliateCouponNotification(couponData) {
    try {
      const { code, discount_value, discount_type, expiry_date, affiliateEmail } = couponData;
      
      const subject = `New Affiliate Coupon Created - ${code}`;
      
      const discountText = discount_type === 'percentage' 
        ? `${discount_value}% OFF` 
        : `₹${discount_value} OFF`;
      
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Affiliate Coupon Created</h2>
          <p>Dear Affiliate Partner,</p>
          <p>A new coupon has been created under your affiliate account. Here are the details:</p>
          
          <div style="background-color: #28a745; color: white; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 24px;">Coupon Code</h3>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${code}</p>
            <p style="margin: 0; font-size: 18px;">${discountText}</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Coupon Details</h3>
            <p><strong>Discount:</strong> ${discountText}</p>
            <p><strong>Valid Until:</strong> ${new Date(expiry_date).toLocaleDateString()}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">Share this coupon with your network to earn commissions on successful purchases.</p>
          <p>Best regards,<br>STORE25 Affiliate Team</p>
        </div>
      `;

      return await this.sendEmail(affiliateEmail, subject, message);
    } catch (error) {
      console.error('❌ Error sending affiliate coupon notification:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendCouponCode(email, couponCode, discountDetails) {
    try {
      const subject = 'Special Discount Coupon - STORE25';
      
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Special Offer Just for You!</h2>
          <p>Thank you for being a valued customer at STORE25.</p>
          
          <div style="background-color: #007bff; color: white; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 24px;">Your Coupon Code</h3>
            <p style="font-size: 28px; font-weight: bold; margin: 10px 0;">${couponCode}</p>
            <p style="margin: 0;">${discountDetails}</p>
          </div>
          
          <p>Use this code at checkout to avail the discount.</p>
          <p style="color: #666; font-size: 14px;">Terms and conditions apply.</p>
          <p>Happy Shopping!<br>STORE25 Team</p>
        </div>
      `;

      return await this.sendEmail(email, subject, message);
    } catch (error) {
      console.error('❌ Error sending coupon code:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
