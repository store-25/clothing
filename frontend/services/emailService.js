const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;

  // Initialize email transporter
  static async initializeTransporter() {
    try {
      console.log('📧 Initializing email service...');
      
      // Check if environment variables are set
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Email credentials not found in environment variables');
        console.log('   Required: EMAIL_USER, EMAIL_PASS');
        this.transporter = null;
        return false;
      }

      console.log(`📧 Using email account: ${process.env.EMAIL_USER}`);
      
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        debug: true, // Enable debug output
        logger: true  // Enable logging
      });

      // Verify transporter
      console.log('📧 Verifying email transporter...');
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      console.log(`📧 Ready to send emails from: ${process.env.EMAIL_USER}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      console.error('📋 Error details:', error);
      
      // Provide specific error guidance
      if (error.code === 'EAUTH') {
        console.error('🔧 Authentication failed. Check EMAIL_USER and EMAIL_PASS');
        console.error('💡 Make sure to:');
        console.error('   1. Use an App Password (not regular password)');
        console.error('   2. Enable 2-factor authentication on Gmail');
        console.error('   3. Generate App Password from Google Account settings');
      } else if (error.code === 'ECONNECTION') {
        console.error('🌐 Connection failed. Check internet connection');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ Connection timed out. Try again');
      }
      
      this.transporter = null;
      return false;
    }
  }

  // Send affiliate coupon creation notification
  static async sendAffiliateCouponNotification(couponData) {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const {
        code,
        discount_type,
        discount_value,
        start_date,
        expiry_date,
        coupon_type,
        affiliateEmail,
        product_ids,
        combo_product_ids
      } = couponData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: affiliateEmail,
        subject: `🎫 Your Affiliate Coupon Code is Ready! - ${code}`,
        html: this.generateAffiliateCouponEmailHTML({
          code,
          discount_type,
          discount_value,
          start_date,
          expiry_date,
          coupon_type,
          affiliateEmail,
          product_ids,
          combo_product_ids
        }),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Affiliate coupon notification email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send affiliate coupon email:', error);
      return false;
    }
  }

  // Generate HTML for affiliate coupon notification email
  static generateAffiliateCouponEmailHTML(data) {
    const {
      code,
      discount_type,
      discount_value,
      start_date,
      expiry_date,
      coupon_type,
      affiliateEmail,
      product_ids,
      combo_product_ids
    } = data;

    const discountText = discount_type === 'percentage' ? `${discount_value}%` : `₹${discount_value}`;
    
    const couponTypeText = {
      'overall': 'All Products',
      'single': 'Selected Products',
      'combo': 'Combo Offer'
    }[coupon_type] || 'All Products';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Affiliate Coupon is Ready!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 15px 15px 0 0; }
          .content { background: #f9fafb; padding: 40px; border-radius: 0 0 15px 15px; }
          .coupon-box { background: white; border: 3px dashed #10b981; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .coupon-code { font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 3px; margin: 15px 0; }
          .discount-badge { background: #fbbf24; color: #92400e; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 18px; margin: 15px 0; }
          .section { margin: 25px 0; padding: 20px; background: white; border-radius: 10px; border-left: 4px solid #10b981; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-item { padding: 15px; background: #f0fdf4; border-radius: 8px; }
          .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 14px; }
          .cta-button { background: #10b981; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>Your Affiliate Coupon Code is Ready to Share</p>
          </div>
          
          <div class="content">
            <div class="coupon-box">
              <h3>Your Exclusive Coupon Code</h3>
              <div class="coupon-code">${code}</div>
              <div class="discount-badge">${discountText} OFF</div>
              <p>Valid on ${couponTypeText}</p>
            </div>

            <div class="section">
              <h3>📋 Coupon Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Discount:</strong><br>
                  ${discountText} off
                </div>
                <div class="info-item">
                  <strong>Valid On:</strong><br>
                  ${couponTypeText}
                </div>
                <div class="info-item">
                  <strong>Start Date:</strong><br>
                  ${new Date(start_date).toLocaleDateString()}
                </div>
                <div class="info-item">
                  <strong>Expiry Date:</strong><br>
                  ${new Date(expiry_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div class="section">
              <h3>💰 How to Earn</h3>
              <p>Share this coupon code with your friends and followers. When they use your code:</p>
              <ul style="text-align: left; margin: 20px 0;">
                <li>They get ${discountText} off their purchase</li>
                <li>You earn affiliate commission on every sale</li>
                <li>Track your performance in your affiliate dashboard</li>
              </ul>
            </div>

            <div class="section">
              <h3>📢 Share Your Code</h3>
              <p>Copy and share this code on social media, WhatsApp, email, or your website:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <code style="font-size: 18px; color: #059669;">${code}</code>
              </div>
              <p style="font-size: 14px; color: #6b7280;">Make sure your followers use exactly this code at checkout!</p>
            </div>

            <div style="text-align: center;">
              <a href="#" class="cta-button">Start Sharing Now</a>
            </div>

            <div class="footer">
              <p><strong>Questions?</strong> Contact our affiliate support team</p>
              <p>This is an automated message from STORE25 Affiliate Program</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send coupon usage notification email
  static async sendCouponUsageNotification(orderData) {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const {
        order_id,
        user_name,
        user_email,
        products,
        total_amount,
        discount_amount,
        final_amount,
        coupon_code,
        created_at
      } = orderData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `🎫 Coupon Used - ${coupon_code} - Order ${order_id}`,
        html: this.generateCouponUsageEmailHTML({
          order_id,
          user_name,
          user_email,
          products,
          total_amount,
          discount_amount,
          final_amount,
          coupon_code,
          created_at
        }),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Coupon usage email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send coupon usage email:', error);
      return false;
    }
  }

  // Generate HTML for coupon usage email
  static generateCouponUsageEmailHTML(data) {
    const {
      order_id,
      user_name,
      user_email,
      products,
      total_amount,
      discount_amount,
      final_amount,
      coupon_code,
      created_at
    } = data;

    const productsHTML = products.map((product, index) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${index + 1}</td>
        <td style="padding: 12px; text-align: left;">${product.name}</td>
        <td style="padding: 12px; text-align: center;">${product.quantity}</td>
        <td style="padding: 12px; text-align: right;">₹${product.price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;">₹${(product.price * product.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Coupon Used - Order Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { margin-bottom: 25px; }
          .coupon-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
          .table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
          .table td { padding: 12px; }
          .total-row { background: #f9fafb; font-weight: bold; }
          .discount-row { background: #fef3c7; color: #92400e; }
          .final-row { background: #dcfce7; color: #166534; font-size: 18px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Coupon Used Successfully!</h1>
            <p>Order notification for coupon usage</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>Order Details</h2>
              <p><strong>Order ID:</strong> ${order_id}</p>
              <p><strong>Date:</strong> ${new Date(created_at).toLocaleString()}</p>
            </div>

            <div class="section">
              <h2>Customer Information</h2>
              <p><strong>Name:</strong> ${user_name}</p>
              <p><strong>Email:</strong> ${user_email}</p>
            </div>

            <div class="section">
              <h2>Coupon Information</h2>
              <div class="coupon-badge">
                Coupon Code: ${coupon_code}
              </div>
              <p><strong>Discount Applied:</strong> ₹${discount_amount.toFixed(2)}</p>
            </div>

            <div class="section">
              <h2>Order Summary</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHTML}
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right; padding: 12px;">Subtotal:</td>
                    <td style="padding: 12px; text-align: right;">₹${total_amount.toFixed(2)}</td>
                  </tr>
                  <tr class="discount-row">
                    <td colspan="4" style="text-align: right; padding: 12px;">Discount:</td>
                    <td style="padding: 12px; text-align: right;">-₹${discount_amount.toFixed(2)}</td>
                  </tr>
                  <tr class="final-row">
                    <td colspan="4" style="text-align: right; padding: 12px;">Final Amount:</td>
                    <td style="padding: 12px; text-align: right;">₹${final_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>This is an automated notification from STORE25 E-commerce System</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send general notification email (reusable method)
  static async sendEmail(to, subject, html) {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}

module.exports = EmailService;
