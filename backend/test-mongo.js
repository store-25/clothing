require('dotenv').config();
const { connectMongoDB, isMongoConnected } = require('./config/mongodb');
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    // Test connection
    await connectMongoDB();
    
    // Check if connected
    if (isMongoConnected()) {
      console.log('✅ MongoDB is connected');
      
      // Test database access
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log('📋 Available collections:', collections.map(c => c.name));
      
      // Check if Order collection exists
      const orderCollectionExists = collections.some(c => c.name === 'orders');
      console.log('📦 Order collection exists:', orderCollectionExists);
      
      if (orderCollectionExists) {
        const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
        const orderCount = await Order.countDocuments();
        console.log('📊 Total orders in database:', orderCount);
      }
      
    } else {
      console.log('❌ MongoDB is not connected');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();
