const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!', timestamp: new Date() });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    port: PORT 
  });
});

// Admin authentication
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Admin login attempt:', { email, password: '***' });
  
  // Validate against environment variables
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = 'dev-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      token: token,
      admin: {
        email: email,
        name: 'Admin User'
      }
    });
    
    console.log('✅ Admin login successful');
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
    
    console.log('❌ Admin login failed');
  }
});

// Admin dashboard stats
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalProducts: 156,
      totalOrders: 89,
      totalRevenue: 245678,
      recentOrders: [
        { id: 'ORD001', customer: 'John Doe', amount: 1299, status: 'completed' },
        { id: 'ORD002', customer: 'Jane Smith', amount: 899, status: 'processing' },
        { id: 'ORD003', customer: 'Bob Johnson', amount: 2199, status: 'pending' }
      ]
    }
  });
});

// Products API
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: [
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
        images: [{ url: '/placeholder.jpg' }]
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
        images: [{ url: '/placeholder.jpg' }]
      }
    ]
  });
});

// Orders API
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: 'ORD001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [
          { name: 'Classic T-Shirt', quantity: 2, price: 299 }
        ],
        totalAmount: 598,
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Coupons API
app.get('/api/coupons', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: '1',
        code: 'SAVE10',
        discount: 10,
        type: 'percentage',
        minAmount: 500,
        status: 'active'
      },
      {
        _id: '2',
        code: 'FLAT50',
        discount: 50,
        type: 'fixed',
        minAmount: 1000,
        status: 'active'
      }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
  console.log(`📈 Admin stats: http://localhost:${PORT}/api/admin/stats`);
});

module.exports = app;
