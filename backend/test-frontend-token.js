require('dotenv').config();
const { connectMongoDB } = require('./config/mongodb');

async function testWithFrontendToken() {
  try {
    console.log('🔍 Testing with frontend token format...');
    
    // Simulate the exact token format the frontend might be using
    // Based on frontend logs, token length is 175 characters
    const frontendToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IkFiaGluYXlAMTEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDI0MjM4NzksImV4cCI6MTc0MjQ1OTQ3OX0.lE8kCKqJc8GnJQpY3WFO5xHrY2fLJ8RzK6J7eHhZo4';
    
    console.log('🔑 Using token (length:', frontendToken.length, ')');
    
    // Test the exact same request the frontend makes
    const response = await fetch('http://localhost:5001/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${frontendToken}`
      }
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Request successful');
      console.log('📋 Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Request failed with status:', response.status);
      console.log('❌ Error response:', errorText);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testWithFrontendToken();
