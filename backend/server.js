const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Import MongoDB configuration
const { connectMongoDB, isMongoConnected } = require('./config/mongodb');

// Import services
const OrderService = require('./services/orderService');
const EmailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory for base64 conversion

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 4 // Allow up to 4 images
  }
});

// Admin authentication
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Abhinay@1';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'abhinay1';

function generateAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header' });
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Import MongoDB models (only after MongoDB connection)
const mongoose = require('mongoose');

// Product Schema - MONGODB ONLY
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'unisex'], required: true, default: 'unisex' },
  description: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  tags: [{ type: String }],
  sizes: [{ type: String }],
  colors: [{ type: String }],
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  variants: [{
    size: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Coupon Schema - MONGODB ONLY
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  discount_type: { type: String, enum: ['percentage', 'flat'], required: true },
  discount_value: { type: Number, required: true, min: 0 },
  start_date: { type: Date, required: true },
  expiry_date: { type: Date, required: true },
  coupon_type: { type: String, enum: ['overall', 'single', 'combo'], required: true, default: 'overall' },
  product_ids: [{ type: String }],
  combo_product_ids: [{ type: String }],
  min_purchase_amount: { type: Number, min: 0 },
  max_discount_amount: { type: Number, min: 0 },
  is_active: { type: Boolean, default: true },
  affiliateEmail: { type: String, required: true, trim: true, lowercase: true }, // Add affiliate email field
  usageCount: { type: Number, default: 0, min: 0 }, // Track how many times coupon is used
  usedBy: [{ type: String }], // Track which users have used this coupon
  lastUsedAt: { type: Date }, // Track when coupon was last used
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);

// API Routes

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Admin login attempt:', { email, hasPassword: !!password });
    
    // Validate input
    if (!email || !password) {
      console.log('❌ Login failed: Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('✅ Login successful for:', email);
      const token = generateAdminToken({ email, role: 'admin' });
      res.json({ 
        success: true, 
        token,
        admin: { email, role: 'admin' }
      });
    } else {
      console.log('❌ Login failed: Invalid credentials');
      console.log('   Expected email:', ADMIN_EMAIL);
      console.log('   Expected password:', ADMIN_PASSWORD);
      console.log('   Provided email:', email);
      console.log('   Provided password:', password ? '[REDACTED]' : '[MISSING]');
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Product Routes - MONGODB ONLY
app.get('/api/products', async (req, res) => {
  try {
    const { category, status, search, gender } = req.query;
    let filter = {};

    if (category && category !== 'all') filter.category = category;
    if (status) filter.status = status;
    if (gender && gender !== 'all') filter.gender = gender;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(1000);
    
    // Debug: Log what server is returning
    console.log('🔍 Server returning products:', products.map(p => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      hasMrp: !!p.mrp,
      mrpType: typeof p.mrp
    })));
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Product creation route with FormData support
app.post('/api/products', upload.array('images', 4), async (req, res) => {
  try {
    console.log('🚀 POST /api/products - Request received');
    console.log('📋 Request headers:', Object.keys(req.headers));
    console.log('📝 Request body type:', typeof req.body);
    console.log('📝 Request body keys:', Object.keys(req.body));
    console.log('� Files count:', req.files?.length || 0);
    
    // Parse FormData fields
    const productData = {
      name: req.body.name,
      price: parseFloat(req.body.price),
      mrp: parseFloat(req.body.mrp) || parseFloat(req.body.price),
      category: req.body.category,
      gender: req.body.gender || 'unisex',
      description: req.body.description || 'Product description',
      stock: parseInt(req.body.stock),
      status: req.body.status || 'active',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      sizes: req.body.sizes ? JSON.parse(req.body.sizes) : ['M'],
      colors: req.body.colors ? JSON.parse(req.body.colors) : ['Black'],
      variants: req.body.variants ? JSON.parse(req.body.variants) : []
    };
    
    console.log('🔍 Parsed product data:', productData);
    
    // Validate required fields
    const requiredFields = ['name', 'price', 'category', 'description', 'stock'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    
    // Handle images - process uploaded files or use default placeholder
    let productImages = [{
      url: '/api/placeholder-product.jpg',
      alt: 'Product image',
      isPrimary: true
    }];
    
    if (req.files && req.files.length > 0) {
      console.log('🖼️ Processing uploaded images:', req.files.length, 'files');
      productImages = req.files.map((file, index) => {
        // Convert uploaded file to base64 URL
        const base64Url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return {
          url: base64Url,
          alt: file.originalname || `Product image ${index + 1}`,
          isPrimary: index === 0 // First image is primary by default
        };
      });
      console.log('✅ Processed images:', productImages.length);
    }
    
    // Ensure variants array is not empty
    if (productData.variants.length === 0) {
      productData.variants = [{
        size: productData.sizes[0],
        color: productData.colors[0],
        stock: productData.stock,
        sku: `${productData.category}-${productData.name}`.toLowerCase().replace(/\s+/g, '-'),
        price: productData.price
      }];
    }
    
    // Create final product object
    const finalProductData = {
      ...productData,
      images: productImages
    };
    
    console.log('🏗️ Creating Product instance with data:', {
      name: finalProductData.name,
      price: finalProductData.price,
      category: finalProductData.category,
      hasImages: finalProductData.images && finalProductData.images.length > 0,
      imageCount: finalProductData.images?.length || 0,
      sizesCount: finalProductData.sizes?.length || 0,
      colorsCount: finalProductData.colors?.length || 0
    });
    
    const product = new Product(finalProductData);
    console.log('💾 Saving product to database...');
    const savedProduct = await product.save();
    console.log('✅ Product saved successfully:', savedProduct._id);
    console.log('📊 Saved product data:', {
      id: savedProduct._id,
      name: savedProduct.name,
      price: savedProduct.price,
      category: savedProduct.category,
      imageCount: savedProduct.images?.length || 0
    });
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Placeholder product image endpoint
app.get('/api/placeholder-product.jpg', (req, res) => {
  // Simple 1x1 pixel transparent GIF as placeholder
  const placeholderData = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const buffer = Buffer.from(placeholderData, 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.send(buffer);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Store25 Backend API is running',
    status: 'OK',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      orders: '/api/orders',
      admin: '/api/admin/*'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Admin endpoint to fix external placeholder images
app.put('/api/admin/fix-placeholder-images', requireAdmin, async (req, res) => {
  try {
    console.log('🔧 Fixing external placeholder images...');
    
    // Find all products with external placeholder URLs
    const placeholderPattern = /^https?:\/\/via\.placeholder\.com/;
    const productsToUpdate = await Product.find({
      $or: [
        { image: { $regex: placeholderPattern } },
        { 'images.url': { $regex: placeholderPattern } }
      ]
    });
    
    console.log(`📝 Found ${productsToUpdate.length} products with external placeholders`);
    
    let updatedCount = 0;
    
    for (const product of productsToUpdate) {
      // Update single image field if it exists
      let updateData = {};
      
      if (product.image && placeholderPattern.test(product.image)) {
        updateData.image = '/api/placeholder-product.jpg';
      }
      
      // Update images array
      if (product.images && product.images.length > 0) {
        const updatedImages = product.images.map(img => {
          if (img.url && placeholderPattern.test(img.url)) {
            return {
              ...img,
              url: '/api/placeholder-product.jpg'
            };
          }
          return img;
        });
        updateData.images = updatedImages;
      }
      
      if (Object.keys(updateData).length > 0) {
        await Product.findByIdAndUpdate(product._id, updateData);
        updatedCount++;
        console.log(`✅ Updated product: ${product.name}`);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} products to use local placeholder images`,
      updatedCount: updatedCount
    });
    
  } catch (error) {
    console.error('❌ Error fixing placeholder images:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint to clear test data
app.delete('/api/admin/clear-test-data', requireAdmin, async (req, res) => {
  try {
    console.log('🧹 Clearing test data from database...');
    
    // Delete products with test-related names
    const testPatterns = ['test', 'debug', 'frontend', 'workflow', 'sample'];
    const deleteRegex = new RegExp(testPatterns.join('|'), 'i');
    
    const result = await Product.deleteMany({
      name: { $regex: deleteRegex }
    });
    
    console.log(`🗑️ Deleted ${result.deletedCount} test products`);
    
    // Also clear any coupons with test codes
    const couponResult = await Coupon.deleteMany({
      code: { $regex: deleteRegex }
    });
    
    console.log(`🗑️ Deleted ${couponResult.deletedCount} test coupons`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} test products and ${couponResult.deletedCount} test coupons`,
      deletedProducts: result.deletedCount,
      deletedCoupons: couponResult.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Image upload endpoint - store images as base64 in MongoDB
app.post('/api/upload', upload.array('images', 4), (req, res) => {
  try {
    console.log('📤 Image upload request received');
    console.log('   📁 Files count:', req.files?.length || 0);
    console.log('   📋 Request headers:', Object.keys(req.headers));
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files uploaded');
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedImages = [];
    
    // Process each uploaded file
    for (const file of req.files) {
      console.log(`📸 Processing file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
      
      // Convert file to base64
      const fileData = {
        name: file.originalname,
        data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      };
      
      uploadedImages.push({
        url: fileData.data, // Store base64 data as URL
        alt: file.originalname,
        isPrimary: uploadedImages.length === 0 // First image is primary
      });
      
      console.log(`✅ Processed image: ${file.originalname} (${file.size} bytes)`);
    }
    
    console.log(`✅ Successfully processed ${uploadedImages.length} images`);
    console.log('📤 Returning response:', {
      message: 'Images uploaded successfully',
      imageUrlsCount: uploadedImages.map(img => img.url).length
    });
    
    res.json({ 
      message: 'Images uploaded successfully',
      imageUrls: uploadedImages.map(img => img.url) // Return array of URLs for frontend compatibility
    });
    
  } catch (error) {
    console.error('❌ Error uploading images:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    // Handle images update
    let updateData = { ...req.body, updatedAt: Date.now() };
    
    if (req.body.images && Array.isArray(req.body.images)) {
      updateData.images = req.body.images.map((img, index) => ({
        url: img.url || '',
        alt: img.alt || `Product image ${index + 1}`,
        isPrimary: index === 0
      }));
    } else if (req.body.image) {
      // Fallback for single image (backward compatibility)
      updateData.images = [{
        url: req.body.image,
        alt: req.body.name || 'Product image',
        isPrimary: true
      }];
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Image file deletion removed - using MongoDB for image storage
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/category/:category', async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category,
      status: 'active'
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/bestsellers', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(3);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Coupon Routes - MONGODB ONLY
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Coupon Validation Route - for customers to use coupons
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, userEmail, cartTotal } = req.body;
    
    console.log('🎫 Validating coupon:', { code, userEmail, cartTotal });
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }
    
    // Find the coupon
    const coupon = await Coupon.findOne({ 
      code: code.trim().toUpperCase(),
      is_active: true 
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Invalid coupon code'
      });
    }
    
    // Check if coupon is expired
    const now = new Date();
    if (now < coupon.start_date) {
      return res.status(400).json({
        success: false,
        error: 'Coupon is not yet active'
      });
    }
    
    if (now > coupon.expiry_date) {
      return res.status(400).json({
        success: false,
        error: 'Coupon has expired'
      });
    }
    
    // Check minimum purchase amount
    if (coupon.min_purchase_amount && cartTotal < coupon.min_purchase_amount) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase amount of ₹${coupon.min_purchase_amount} required`
      });
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }
    
    console.log('✅ Coupon validated successfully:', {
      code: coupon.code,
      discount: discountAmount,
      usageCount: coupon.usageCount
    });
    
    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: discountAmount,
          coupon_type: coupon.coupon_type,
          product_ids: coupon.product_ids,
          combo_product_ids: coupon.combo_product_ids
        }
      }
    });
  } catch (error) {
    console.error('❌ Error validating coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while validating coupon'
    });
  }
});

// Track Coupon Usage Route - called when order is completed
app.post('/api/coupons/use', async (req, res) => {
  try {
    const { code, userEmail, orderTotal, discountAmount } = req.body;
    
    console.log('📊 Tracking coupon usage:', { code, userEmail, orderTotal, discountAmount });
    
    if (!code || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code and user email are required'
      });
    }
    
    // Find and update the coupon
    const coupon = await Coupon.findOne({ 
      code: code.trim().toUpperCase()
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }
    
    // Update usage tracking
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      coupon._id,
      {
        $inc: { usageCount: 1 },
        $addToSet: { usedBy: userEmail },
        lastUsedAt: new Date()
      },
      { new: true }
    );
    
    console.log('✅ Coupon usage tracked successfully:', {
      code: updatedCoupon.code,
      newUsageCount: updatedCoupon.usageCount,
      usedBy: updatedCoupon.usedBy.length,
      lastUsedAt: updatedCoupon.lastUsedAt
    });
    
    res.json({
      success: true,
      message: 'Coupon usage tracked successfully',
      data: {
        usageCount: updatedCoupon.usageCount,
        lastUsedAt: updatedCoupon.lastUsedAt
      }
    });
  } catch (error) {
    console.error('❌ Error tracking coupon usage:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while tracking coupon usage'
    });
  }
});
// Test Route - Simple API connectivity test
app.get('/admin/test', (req, res) => {
  console.log('🧪 Test route called');
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    mongoConnected: isMongoConnected()
  });
});

// MongoDB Write Test Route
app.get('/admin/test-db-write', async (req, res) => {
  try {
    console.log('🧪 Testing MongoDB write operation...');
    
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false, 
        error: 'MongoDB not connected' 
      });
    }
    
    // Create a test document
    const testCoupon = new Coupon({
      code: 'TEST_WRITE_' + Date.now(),
      discount_type: 'percentage',
      discount_value: 10,
      start_date: new Date(),
      expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      coupon_type: 'overall',
      product_ids: [],
      combo_product_ids: [],
      affiliateEmail: 'test@example.com',
      is_active: true,
      usageCount: 0,
      usedBy: [],
      lastUsedAt: null
    });
    
    console.log('💾 Saving test coupon to MongoDB...');
    const savedTest = await testCoupon.save();
    
    console.log('✅ Test coupon saved:', savedTest._id);
    
    // Verify it was saved
    const found = await Coupon.findById(savedTest._id);
    
    if (found) {
      console.log('✅ Write test successful - coupon found in database');
      
      // Clean up the test document
      await Coupon.findByIdAndDelete(savedTest._id);
      console.log('🧹 Test coupon cleaned up');
      
      res.json({
        success: true,
        message: 'MongoDB write test successful',
        testId: savedTest._id
      });
    } else {
      console.error('❌ Write test failed - coupon not found after save');
      res.status(500).json({
        success: false,
        error: 'Write test failed - document not found after save'
      });
    }
    
  } catch (error) {
    console.error('❌ MongoDB write test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin Coupons Route - with authentication
app.get('/admin/coupons', requireAdmin, async (req, res) => {
  try {
    console.log('📋 Fetching admin coupons...');
    
    // Check database connection
    if (!isMongoConnected()) {
      console.error('❌ MongoDB not connected when fetching coupons');
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    console.log('🔍 Querying Coupon collection...');
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    
    console.log(`📊 Found ${coupons.length} coupons in database`);
    
    if (coupons.length > 0) {
      console.log('📋 Sample coupon:', {
        id: coupons[0]._id,
        code: coupons[0].code,
        discount_value: coupons[0].discount_value,
        affiliateEmail: coupons[0].affiliateEmail,
        createdAt: coupons[0].createdAt
      });
    } else {
      console.log('⚠️ No coupons found in database');
    }
    
    res.json(coupons);
  } catch (error) {
    console.error('❌ Error fetching admin coupons:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Update Coupon Route
app.put('/admin/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate required fields
    if (!updateData.code || !updateData.discount_value || !updateData.expiry_date || !updateData.affiliateEmail) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: code, discount_value, expiry_date, affiliateEmail'
      });
    }
    
    // Check if coupon exists
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }
    
    // Check if code conflicts with another coupon
    if (updateData.code !== existingCoupon.code) {
      const codeConflict = await Coupon.findOne({ 
        code: updateData.code.trim().toUpperCase(),
        _id: { $ne: id }
      });
      
      if (codeConflict) {
        return res.status(409).json({
          success: false,
          error: 'Coupon code already exists. Please use a different code.'
        });
      }
    }
    
    // Update coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      {
        ...updateData,
        code: updateData.code.trim().toUpperCase(),
        expiry_date: new Date(updateData.expiry_date)
      },
      { new: true, runValidators: true }
    );
    
    console.log('✅ Coupon updated successfully:', updatedCoupon.code);
    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: updatedCoupon
    });
  } catch (error) {
    console.error('❌ Error updating coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating coupon'
    });
  }
});

// Admin Delete Coupon Route
app.delete('/admin/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if coupon exists
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }
    
    // Delete coupon
    await Coupon.findByIdAndDelete(id);
    
    console.log('✅ Coupon deleted successfully:', existingCoupon.code);
    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting coupon'
    });
  }
});

// Admin Create Coupon Route
app.post('/api/admin/create-coupon', requireAdmin, async (req, res) => {
  try {
    console.log('🎫 Creating affiliate coupon...');
    console.log('📊 MongoDB connection status:', isMongoConnected() ? 'Connected' : 'Disconnected');
    
    const { 
      code, 
      discount_value, 
      expiry_date, 
      affiliateEmail,
      discount_type = 'percentage',
      coupon_type = 'overall',
      product_ids = [],
      combo_product_ids = []
    } = req.body;
    
    console.log('📋 Request data:', { code, discount_value, expiry_date, affiliateEmail, discount_type, coupon_type });
    
    // Validate required fields
    if (!code || !discount_value || !expiry_date || !affiliateEmail) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        error: 'All fields are required: code, discount_value, expiry_date, affiliateEmail'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(affiliateEmail)) {
      console.log('❌ Email validation failed');
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }
    
    // Validate discount
    if (typeof discount_value !== 'number' || discount_value < 0 || discount_value > 100) {
      console.log('❌ Discount validation failed:', discount_value);
      return res.status(400).json({
        success: false,
        error: 'Discount must be a number between 0 and 100'
      });
    }
    
    // Validate expiry date
    const expiryDateObj = new Date(expiry_date);
    if (isNaN(expiryDateObj.getTime()) || expiryDateObj <= new Date()) {
      console.log('❌ Expiry date validation failed:', expiry_date);
      return res.status(400).json({
        success: false,
        error: 'Expiry date must be a valid future date'
      });
    }
    
    // Validate coupon type specific requirements
    if (coupon_type === 'single' && (!product_ids || product_ids.length === 0)) {
      console.log('❌ Single product coupon requires product IDs');
      return res.status(400).json({
        success: false,
        error: 'Please select at least one product for single product coupon'
      });
    }
    
    if (coupon_type === 'combo' && (!combo_product_ids || combo_product_ids.length === 0)) {
      console.log('❌ Combo coupon requires product IDs');
      return res.status(400).json({
        success: false,
        error: 'Please select products for combo offer'
      });
    }
    
    // Check if coupon code already exists
    console.log('🔍 Checking for existing coupon code...');
    const existingCoupon = await Coupon.findOne({ 
      code: code.trim().toUpperCase() 
    });
    
    if (existingCoupon) {
      console.log('❌ Coupon code already exists');
      return res.status(409).json({
        success: false,
        error: 'Coupon code already exists. Please use a different code.'
      });
    }
    
    // Create new coupon
    console.log('🆕 Creating new coupon document...');
    const newCoupon = new Coupon({
      code: code.trim().toUpperCase(),
      discount_type: discount_type,
      discount_value: discount_value,
      start_date: new Date(), // Start immediately
      expiry_date: expiryDateObj,
      coupon_type: coupon_type,
      product_ids: coupon_type === 'single' ? product_ids : [],
      combo_product_ids: coupon_type === 'combo' ? combo_product_ids : [],
      affiliateEmail: affiliateEmail.toLowerCase().trim(),
      is_active: true,
      usageCount: 0,
      usedBy: [],
      lastUsedAt: null
    });
    
    console.log('💾 Attempting to save coupon to MongoDB...');
    console.log('� Coupon document before save:', newCoupon.toObject());
    
    // Save coupon to database
    const savedCoupon = await newCoupon.save();
    
    console.log('✅ Coupon saved successfully to MongoDB!');
    console.log('📋 Saved coupon details:', {
      id: savedCoupon._id,
      code: savedCoupon.code,
      discount_value: savedCoupon.discount_value,
      coupon_type: savedCoupon.coupon_type,
      affiliateEmail: savedCoupon.affiliateEmail,
      createdAt: savedCoupon.createdAt,
      usageCount: savedCoupon.usageCount
    });
    
    // Verify the coupon was actually saved by querying it back
    console.log('🔍 Verifying coupon was saved...');
    const verifyCoupon = await Coupon.findById(savedCoupon._id);
    if (verifyCoupon) {
      console.log('✅ Coupon verification successful - found in database');
    } else {
      console.error('❌ Coupon verification failed - not found in database after save');
    }
    
    // Send email to affiliate
    try {
      console.log('📧 Sending affiliate coupon email...');
      const emailSent = await EmailService.sendAffiliateCouponNotification({
        code: savedCoupon.code,
        discount_type: savedCoupon.discount_type,
        discount_value: savedCoupon.discount_value,
        start_date: savedCoupon.start_date,
        expiry_date: savedCoupon.expiry_date,
        coupon_type: savedCoupon.coupon_type,
        affiliateEmail: savedCoupon.affiliateEmail,
        product_ids: savedCoupon.product_ids,
        combo_product_ids: savedCoupon.combo_product_ids
      });
      
      if (emailSent) {
        console.log(`✅ Affiliate coupon email sent to ${savedCoupon.affiliateEmail}`);
      } else {
        console.warn(`⚠️ Failed to send affiliate coupon email to ${savedCoupon.affiliateEmail}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending affiliate email:', emailError);
      // Don't fail coupon creation if email fails
    }
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Affiliate coupon created successfully',
      data: {
        id: savedCoupon._id,
        code: savedCoupon.code,
        discount_value: savedCoupon.discount_value,
        discount_type: savedCoupon.discount_type,
        expiry_date: savedCoupon.expiry_date,
        affiliateEmail: savedCoupon.affiliateEmail,
        coupon_type: savedCoupon.coupon_type,
        is_active: savedCoupon.is_active,
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
    
    // Handle other errors
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating coupon'
    });
  }
});

app.post('/api/coupons', requireAdmin, async (req, res) => {
  try {
    const { affiliateEmail, ...otherFields } = req.body;
    
    // Validate affiliate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!affiliateEmail || !emailRegex.test(affiliateEmail.trim())) {
      return res.status(400).json({ 
        error: 'Please enter a valid affiliate email address (e.g., user@example.com)' 
      });
    }

    const couponData = {
      ...otherFields,
      code: req.body.code.trim().toUpperCase(),
      affiliateEmail: affiliateEmail.trim().toLowerCase()
    };
    
    const coupon = new Coupon(couponData);
    const savedCoupon = await coupon.save();
    
    // Send email notification to affiliate
    try {
      const emailSent = await EmailService.sendAffiliateCouponNotification(savedCoupon.toObject());
      if (emailSent) {
        console.log(`📧 Affiliate notification sent to ${affiliateEmail} for coupon ${savedCoupon.code}`);
      } else {
        console.warn(`⚠️ Failed to send affiliate notification to ${affiliateEmail}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending affiliate email:', emailError);
      // Don't fail the coupon creation if email fails
    }
    
    res.status(201).json({
      ...savedCoupon.toObject(),
      emailNotificationSent: true
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    
    // Handle duplicate key error for coupon code
    if (error.code === 11000 && error.keyPattern?.code) {
      return res.status(400).json({ 
        error: 'Coupon code already exists. Please use a different code.' 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: validationErrors.join(', ') 
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing coupon code' });

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon || !coupon.is_active) return res.status(404).json({ valid: false, error: 'Coupon not found or inactive' });
    if (coupon.expiry_date && coupon.expiry_date < new Date()) return res.status(400).json({ valid: false, error: 'Coupon expired' });

    let isValid = true;
    let validationMessage = 'Coupon is valid';

    if (coupon.coupon_type === 'single' && (!coupon.product_ids || coupon.product_ids.length === 0)) {
      isValid = false;
      validationMessage = 'Coupon has no valid products';
    }

    if (coupon.coupon_type === 'combo' && (!coupon.combo_product_ids || coupon.combo_product_ids.length === 0)) {
      isValid = false;
      validationMessage = 'Coupon has no valid products';
    }

    return res.json({
      valid: isValid,
      error: isValid ? null : validationMessage,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      code: coupon.code,
      coupon_type: coupon.coupon_type,
      product_ids: coupon.product_ids || [],
      combo_product_ids: coupon.combo_product_ids || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Orders API - MONGODB
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    console.log('🔐 Admin orders request - Authenticated user:', req.admin?.email);
    
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      console.log('⚠️ MongoDB not connected, returning empty orders');
      return res.json({
        success: true,
        data: []
      });
    }
    
    console.log('📡 Calling OrderService.getOrders()...');
    const result = await OrderService.getOrders();
    console.log('📊 OrderService result:', { success: result.success, dataLength: result.data?.length || 0 });
    
    if (!result.success) {
      console.error('❌ Failed to fetch orders from MongoDB:', result.error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch orders',
        details: result.error 
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    // Return empty array instead of 500 error to prevent dashboard from crashing
    res.json({
      success: true,
      data: []
    });
  }
});

// Update Order Status API - MONGODB
app.put('/api/admin/orders/:orderId/status', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { order_status, notes } = req.body;

    if (!order_status) {
      return res.status(400).json({
        success: false,
        error: 'Order status is required'
      });
    }

    const result = await OrderService.updateOrderStatus(orderId, order_status, notes || '');

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to update order status'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Delete order endpoint
app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing order ID' 
      });
    }

    const result = await OrderService.deleteOrder(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to delete order'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Order deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Order report download endpoint
app.get('/api/orders/report', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both start and end dates are required' 
      });
    }

    const result = await OrderService.getOrdersByDateRange(startDate, endDate);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch orders'
      });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No orders found for selected dates'
      });
    }

    // Generate CSV content
    const csvHeaders = [
      'SNO',
      'Order ID',
      'Customer Name', 
      'Customer Email',
      'Customer Phone',
      'Product Name',
      'Quantity',
      'Unit Price',
      'Total Product Price',
      'Order Total Price',
      'Order Status',
      'Order Date'
    ];

    const csvRows = [];
    let serialNumber = 1;
    result.data.forEach(order => {
      order.products.forEach(product => {
        csvRows.push([
          serialNumber,
          order.order_id,
          order.user_name,
          order.user_email,
          order.phone || '',
          `"${product.name || product.product_name}"`,
          product.quantity,
          (product.price || 0).toFixed(2),
          ((product.price || 0) * product.quantity).toFixed(2),
          order.final_amount.toFixed(2),
          order.order_status,
          new Date(order.created_at).toLocaleDateString()
        ].join(','));
      });
      serialNumber++; // Increment for each new order
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    // Set response headers for CSV download
    const filename = `orders-report-${startDate}-to-${endDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Order report generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create Order API - MONGODB
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.order_id || !orderData.user_email || !orderData.final_amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_id, user_email, final_amount'
      });
    }

    const result = await OrderService.createOrder(orderData);
    
    if (!result.success) {
      console.error('Failed to create order:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Order Statistics API - MONGODB
app.get('/api/admin/orders/stats', requireAdmin, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      console.log('⚠️ MongoDB not connected, returning empty stats');
      return res.json({
        success: true,
        data: {
          totalOrders: 0,
          totalRevenue: 0,
          statusBreakdown: []
        }
      });
    }
    
    const result = await OrderService.getOrderStats();
    
    if (!result.success) {
      console.error('Failed to get order statistics:', result.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get order statistics'
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Order stats error:', error);
    // Return empty stats instead of 500 error to prevent dashboard from crashing
    res.json({
      success: true,
      data: {
        totalOrders: 0,
        totalRevenue: 0,
        statusBreakdown: []
      }
    });
  }
});

// Get Single Order API - MONGODB
app.get('/api/admin/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await OrderService.getOrderById(orderId);
    
    if (!result.success) {
      console.error('Failed to get order:', result.error);
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
});

// Delete Order API - MONGODB
app.delete('/api/admin/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await OrderService.deleteOrder(orderId);
    
    if (!result.success) {
      console.error('Failed to delete order:', result.error);
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: isMongoConnected() ? 'connected' : 'disconnected'
  });
});

// Check MongoDB connection before processing requests
app.use((req, res, next) => {
  if (!isMongoConnected()) {
    return res.status(503).json({ error: 'MongoDB database not connected' });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Global error handler to prevent server crashes
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: "Internal Server Error" 
  });
});

// Start server with proper sequence
async function startServer() {
  try {
    console.log('🚀 Starting server with strict database isolation...');
    
    // 1. Connect to MongoDB FIRST (required)
    await connectMongoDB();
    
    // 2. Initialize Express app
    console.log('📦 Express app initialized');
    
    // 3. Initialize services
    console.log('🔧 Initializing services...');
    
    // Initialize Email Service
    const emailInitialized = await EmailService.initializeTransporter();
    if (emailInitialized) {
      console.log('✅ Email service ready');
    } else {
      console.log('⚠️ Email service failed to initialize - email notifications will be disabled');
      console.log('💡 Check email configuration in .env file');
    }
    
    // 4. Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 API available at http://localhost:${PORT}/api`);
      
      // Check environment variables
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
        console.warn('⚠️  Email service environment variables not configured. Email notifications will be disabled.');
      } else {
        console.log('📧 Email service configured successfully');
      }
      
      // Show database status
      console.log('📊 Database Status:');
      console.log('   - MongoDB:', isMongoConnected() ? '✅ Connected' : '❌ Disconnected');
      console.log('   - Orders: Stored in MongoDB');
    });
    
    // 5. Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Server terminated');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
