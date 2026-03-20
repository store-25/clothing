const http = require('http');

async function testBackend() {
  try {
    console.log('🔍 Testing backend connection...');
    
    const response = await fetch('http://localhost:5001/api/health');
    const data = await response.json();
    
    console.log('✅ Backend is responding:', data);
    process.exit(0);
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    process.exit(1);
  }
}

testBackend();
