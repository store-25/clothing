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

async function fixAllImages() {
  try {
    await connectMongoDB();
    
    const Product = mongoose.model('Product', productSchema);
    
    console.log('🔧 Fixing all product images...');
    
    // Find all products
    const products = await Product.find();
    console.log(`📊 Found ${products.length} products`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      let updateData = {};
      
      // Check and fix images array
      if (product.images && product.images.length > 0) {
        const updatedImages = product.images.map(img => {
          if (img.url && img.url.includes('via.placeholder.com')) {
            console.log(`🔄 Updating ${product.name}: ${img.url.substring(0, 50)}...`);
            needsUpdate = true;
            return {
              ...img,
              url: '/api/placeholder-product.jpg'
            };
          }
          return img;
        });
        
        if (needsUpdate) {
          updateData.images = updatedImages;
        }
      }
      
      // Check and fix single image field
      if (product.image && product.image.includes('via.placeholder.com')) {
        console.log(`🔄 Updating single image for ${product.name}`);
        needsUpdate = true;
        updateData.image = '/api/placeholder-product.jpg';
      }
      
      // Update if needed
      if (needsUpdate) {
        await Product.findByIdAndUpdate(product._id, updateData);
        updatedCount++;
        console.log(`✅ Updated: ${product.name}`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} products`);
    
    // Verify the fix
    console.log('\n🔍 Verification:');
    const stillBroken = await Product.find({
      'images.url': { $regex: 'via.placeholder.com' }
    });
    
    if (stillBroken.length === 0) {
      console.log('✅ All products fixed!');
    } else {
      console.log(`⚠️ Still ${stillBroken.length} products with external placeholders`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllImages();
