const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  async initializeTransporter() {
    try {
      // Check if email credentials are available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email credentials not found in environment variables');
        return false;
      }

      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify the connection
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured) {
      console.warn('⚠️  Email service not configured. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"Store25" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return false;
    }
  }

  // Send congratulations email to affiliate
  async sendAffiliateCouponEmail({ affiliateEmail, couponCode, discount, expiryDate }) {
    const subject = "Congratulations! Your Store25 Affiliate Coupon is Live 🎉";
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Affiliate Coupon is Live!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .coupon-box { background: white; border: 2px dashed #000; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
          .coupon-code { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000; margin: 10px 0; }
          .discount { font-size: 18px; color: #28a745; font-weight: bold; }
          .expiry { color: #dc3545; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          .cta-button { display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p>Your Affiliate Coupon is Now Live</p>
        </div>
        
        <div class="content">
          <h2>Welcome to the Store25 Affiliate Program!</h2>
          <p>Your exclusive coupon code has been created and is ready to share with your audience.</p>
          
          <div class="coupon-box">
            <h3>Your Coupon Code:</h3>
            <div class="coupon-code">${couponCode}</div>
            <div class="discount">${discount}% DISCOUNT</div>
            <p class="expiry">Valid until: ${new Date(expiryDate).toLocaleDateString()}</p>
          </div>
          
          <h3>How to Maximize Your Earnings:</h3>
          <ul>
            <li>Share your coupon code on social media</li>
            <li>Include it in your blog posts or videos</li>
            <li>Tell your friends and followers about Store25</li>
            <li>You'll earn a commission for every purchase made with your code</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="https://store25.com" class="cta-button">Visit Store25</a>
          </div>
          
          <p>Every time someone uses your coupon code, you'll receive an email notification with usage details.</p>
          <p>Thank you for partnering with us! Let's grow together. 🚀</p>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The Store25 Team</p>
          <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: affiliateEmail,
      subject,
      html
    });
  }

  // Send usage notification to affiliate
  async sendCouponUsageEmail({ affiliateEmail, couponCode, usageCount }) {
    const subject = "Your Coupon Was Just Used 🎉";
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Coupon Was Used!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .stats-box { background: white; border: 2px solid #28a745; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
          .coupon-code { font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #000; margin: 10px 0; }
          .usage-count { font-size: 36px; font-weight: bold; color: #28a745; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Great News!</h1>
          <p>Your Coupon Code Was Just Used</p>
        </div>
        
        <div class="content">
          <h2>Another Successful Conversion!</h2>
          <p>Someone just used your affiliate coupon code to make a purchase at Store25.</p>
          
          <div class="stats-box">
            <h3>Coupon Code:</h3>
            <div class="coupon-code">${couponCode}</div>
            <div class="usage-count">${usageCount}</div>
            <p>Total Uses So Far</p>
          </div>
          
          <h3>Keep Up the Great Work!</h3>
          <p>Your marketing efforts are paying off. Every usage brings you closer to your earnings goals.</p>
          
          <p>Continue sharing your coupon code and watch your commissions grow!</p>
        </div>
        
        <div class="footer">
          <p>Thank you for being a valued affiliate partner!<br>The Store25 Team</p>
          <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: affiliateEmail,
      subject,
      html
    });
  }

  // Helper method to strip HTML for text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured,
      emailUser: process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-4) : null
    };
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;
