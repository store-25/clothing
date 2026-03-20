require('dotenv').config();
const { connectMongoDB } = require('./config/mongodb');
const mongoose = require('mongoose');

// Product Schema
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

async function checkProducts() {
  try {
    await connectMongoDB();
    
    const Product = mongoose.model('Product', productSchema);
    
    console.log('🔍 Checking products in database...');
    
    const count = await Product.countDocuments();
    console.log(`📊 Total products: ${count}`);
    
    if (count > 0) {
      const products = await Product.find().limit(5);
      console.log('\n📋 Sample products:');
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Price: ₹${product.price}`);
        console.log(`   Images: ${product.images?.length || 0}`);
        if (product.images && product.images.length > 0) {
          product.images.forEach((img, i) => {
            console.log(`     ${i + 1}. ${img.url.substring(0, 50)}...`);
            if (img.url.includes('via.placeholder.com')) {
              console.log(`        ⚠️ EXTERNAL PLACEHOLDER DETECTED!`);
            }
          });
        }
      });
    } else {
      console.log('❌ No products found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProducts();
