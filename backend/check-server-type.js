const https = require('https');

// Test which server is running on Render
const testUrl = 'https://store25-0ven.onrender.com/api/products';

console.log('🔍 Testing which server is running on Render...');

https.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('📊 Products response:', products);
      
      if (Array.isArray(products)) {
        console.log('✅ Server is running correctly');
        console.log('📦 Number of products:', products.length);
        
        if (products.length > 0) {
          const firstProduct = products[0];
          console.log('🔍 First product:', {
            id: firstProduct._id,
            name: firstProduct.name,
            hasMongoId: !!firstProduct._id,
            idType: typeof firstProduct._id
          });
          
          // Check if it's a MongoDB ObjectId
          if (typeof firstProduct._id === 'string' && firstProduct._id.length === 24) {
            console.log('✅ Using MongoDB (ObjectId detected)');
          } else if (typeof firstProduct._id === 'string' && !isNaN(firstProduct._id)) {
            console.log('❌ Using in-memory storage (numeric ID detected)');
          } else {
            console.log('⚠️  Unknown storage type');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
    }
  });
}).on('error', (error) => {
  console.error('❌ Request error:', error.message);
});
