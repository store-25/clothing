const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.memoryStorage();
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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Thalaiva';

function generateAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// In-memory storage
let products = [];
let coupons = [];
let orders = [];
let nextProductId = 1;
let nextCouponId = 1;
let nextOrderId = 1;

// Helper functions
function createProduct(data) {
  const id = nextProductId++;
  return {
    _id: id.toString(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createCoupon(data) {
  const id = nextCouponId++;
  return {
    _id: id.toString(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createOrder(data) {
  const id = nextOrderId++;
  return {
    _id: id.toString(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development',
    message: 'Server is running without MongoDB'
  });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = generateAdminToken({ email, timestamp: Date.now() });
      
      res.json({ 
        success: true, 
        message: 'Login successful',
        token: token,
        admin: { email, name: 'Admin User' }
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const { category, status, search, gender } = req.query;
    let filteredProducts = [...products];
    
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    if (status) {
      filteredProducts = filteredProducts.filter(p => p.status === status);
    }
    if (gender && gender !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.gender === gender);
    }
    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = products.find(p => p._id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', upload.array('images', 4), async (req, res) => {
  try {
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
      colors: req.body.colors ? JSON.parse(req.body.colors) : ['Black']
    };
    
    // Handle images
    let productImages = [{
      url: '/api/placeholder-product.jpg',
      alt: 'Product image',
      isPrimary: true
    }];
    
    if (req.files && req.files.length > 0) {
      productImages = req.files.map((file, index) => {
        const base64Url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return {
          url: base64Url,
          alt: file.originalname || `Product image ${index + 1}`,
          isPrimary: index === 0
        };
      });
    }
    
    productData.images = productImages;
    const newProduct = createProduct(productData);
    products.unshift(newProduct);
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const index = products.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products[index] = {
      ...products[index],
      ...req.body,
      updatedAt: new Date()
    };
    
    res.json(products[index]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const index = products.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(index, 1);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Coupon Routes
app.get('/api/coupons', async (req, res) => {
  try {
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons', requireAdmin, async (req, res) => {
  try {
    const couponData = {
      code: req.body.code.trim().toUpperCase(),
      discount_type: req.body.discount_type || 'percentage',
      discount_value: parseFloat(req.body.discount_value),
      start_date: new Date(req.body.start_date),
      expiry_date: new Date(req.body.expiry_date),
      min_purchase_amount: parseFloat(req.body.min_purchase_amount) || 0,
      max_discount_amount: parseFloat(req.body.max_discount_amount) || null,
      is_active: req.body.is_active !== false,
      affiliateEmail: req.body.affiliateEmail,
      usageCount: 0,
      usedBy: []
    };
    
    const newCoupon = createCoupon(couponData);
    coupons.unshift(newCoupon);
    
    res.status(201).json(newCoupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const index = coupons.findIndex(c => c._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    coupons[index] = {
      ...coupons[index],
      ...req.body,
      updatedAt: new Date()
    };
    
    res.json(coupons[index]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const index = coupons.findIndex(c => c._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    coupons.splice(index, 1);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Order Routes
app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      order_id: req.body.order_id || `ORD${Date.now()}`,
      status: 'pending'
    };
    
    const newOrder = createOrder(orderData);
    orders.unshift(newOrder);
    
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Placeholder image
app.get('/api/placeholder-product.jpg', (req, res) => {
  const placeholderData = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const buffer = Buffer.from(placeholderData, 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.send(buffer);
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 STORE25 Backend Server Started Successfully!');
  console.log('==========================================');
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Admin Login: http://localhost:${PORT}/api/admin/login`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🎫 Coupons API: http://localhost:${PORT}/api/coupons`);
  console.log(`📥 Orders API: http://localhost:${PORT}/api/orders`);
  console.log('');
  console.log('👤 Admin Credentials:');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('');
  console.log('✅ Server is ready for connections!');
  console.log('🌐 Frontend should connect to: http://localhost:5001/api');
});

module.exports = app;
