require('dotenv').config();
const { connectMongoDB, isMongoConnected } = require('./config/mongodb');

async function testAdminAPI() {
  try {
    console.log('🔍 Testing Admin API...');
    
    // Connect to MongoDB first
    await connectMongoDB();
    
    // Test login to get token
    const loginResponse = await fetch('http://localhost:5001/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'Abhinay@1',
        password: process.env.ADMIN_PASSWORD || 'Thalaiva'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Admin login successful');
      const token = loginData.token;
      console.log('🔑 Token length:', token.length);
      
      // Test admin orders endpoint
      console.log('📡 Testing /api/admin/orders...');
      const ordersResponse = await fetch('http://localhost:5001/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 Orders response status:', ordersResponse.status);
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('✅ Orders API successful');
        console.log('📋 Response:', ordersData);
      } else {
        const errorData = await ordersResponse.text();
        console.log('❌ Orders API failed:', errorData);
      }
      
    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Admin login failed:', errorData);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAdminAPI();
