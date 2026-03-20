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
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@store25.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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

// In-memory storage for development (replace with MongoDB in production)
let products = [
  {
    _id: '1',
    name: 'Classic T-Shirt',
    price: 299,
    mrp: 499,
    category: 'tops',
    gender: 'male',
    description: 'Comfortable cotton t-shirt',
    stock: 50,
    status: 'active',
    images: [{ url: '/api/placeholder-product.jpg', alt: 'Classic T-Shirt', isPrimary: true }],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Gray'],
    tags: ['cotton', 'casual'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    name: 'Denim Jeans',
    price: 899,
    mrp: 1299,
    category: 'bottoms',
    gender: 'male',
    description: 'Classic denim jeans',
    stock: 30,
    status: 'active',
    images: [{ url: '/api/placeholder-product.jpg', alt: 'Denim Jeans', isPrimary: true }],
    sizes: ['30', '32', '34', '36'],
    colors: ['Blue', 'Black'],
    tags: ['denim', 'casual'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let coupons = [
  {
    _id: '1',
    code: 'SAVE10',
    discount_type: 'percentage',
    discount_value: 10,
    start_date: new Date(),
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    coupon_type: 'overall',
    product_ids: [],
    combo_product_ids: [],
    min_purchase_amount: 500,
    max_discount_amount: 100,
    is_active: true,
    affiliateEmail: 'admin@store25.com',
    usageCount: 0,
    usedBy: [],
    lastUsedAt: null,
    createdAt: new Date()
  }
];

let orders = [];

// API Routes

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Admin login attempt:', { email, hasPassword: !!password });
    
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
      
      console.log('✅ Admin login successful');
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
      console.log('❌ Admin login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
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
      _id: Date.now().toString(),
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
      createdAt: new Date(),
      updatedAt: new Date()
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
    products.unshift(productData); // Add to beginning of array
    
    res.status(201).json(productData);
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
      _id: Date.now().toString(),
      ...req.body,
      code: req.body.code.trim().toUpperCase(),
      createdAt: new Date(),
      usageCount: 0,
      usedBy: [],
      lastUsedAt: null
    };
    
    coupons.unshift(couponData);
    res.status(201).json(couponData);
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
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    
    orders.unshift(orderData);
    res.status(201).json(orderData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Utility endpoints
app.get('/api/placeholder-product.jpg', (req, res) => {
  const placeholderData = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const buffer = Buffer.from(placeholderData, 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.send(buffer);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`🎫 Coupons: http://localhost:${PORT}/api/coupons`);
});

module.exports = app;
