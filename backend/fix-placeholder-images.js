require('dotenv').config();

async function fixPlaceholderImages() {
  try {
    // First, login to get admin token
    console.log('🔐 Getting admin token...');
    
    const loginResponse = await fetch('http://localhost:5001/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'Abhinay@1',
        password: process.env.ADMIN_PASSWORD || 'Thalaiva'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Admin login successful');
    
    // Fix placeholder images
    console.log('🔧 Fixing placeholder images...');
    
    const fixResponse = await fetch('http://localhost:5001/api/admin/fix-placeholder-images', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (fixResponse.ok) {
      const result = await fixResponse.json();
      console.log('✅ Fixed placeholder images:', result);
    } else {
      console.log('❌ Fix failed:', await fixResponse.text());
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPlaceholderImages();
