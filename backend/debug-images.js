require('dotenv').config();
const { connectMongoDB } = require('./config/mongodb');
const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }]
}, { strict: false });

async function debugImages() {
  try {
    await connectMongoDB();
    
    const Product = mongoose.model('Product', productSchema);
    
    console.log('🔍 Debugging product images...');
    
    // Find products with external placeholders
    const products = await Product.find({
      'images.url': { $regex: 'via.placeholder.com' }
    });
    
    console.log(`📊 Found ${products.length} products with external placeholders`);
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Images array:`, JSON.stringify(product.images, null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugImages();
