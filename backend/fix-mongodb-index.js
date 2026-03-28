const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://store25business_db_user:Thalaiva@store25db.hkwcq1i.mongodb.net/?appName=store25DB')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Create indexes for better performance
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    try {
      // Create index on createdAt for sorting
      await productsCollection.createIndex({ createdAt: -1 });
      console.log('✅ Created index on createdAt');
      
      // Create compound index for common queries
      await productsCollection.createIndex({ category: 1, status: 1, createdAt: -1 });
      console.log('✅ Created compound index on category, status, createdAt');
      
      // Create text index for search
      await productsCollection.createIndex({ 
        name: 'text', 
        description: 'text', 
        category: 'text' 
      });
      console.log('✅ Created text search index');
      
      console.log('🎉 All indexes created successfully!');
      
      // Check existing products
      const count = await productsCollection.countDocuments();
      console.log(`📊 Current products in database: ${count}`);
      
      if (count > 0) {
        const sample = await productsCollection.find().limit(1).toArray();
        console.log('🔍 Sample product:', {
          id: sample[0]._id,
          name: sample[0].name,
          createdAt: sample[0].createdAt
        });
      }
      
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
