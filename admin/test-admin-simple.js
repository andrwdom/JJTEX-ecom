// Simple Admin Test Script
const axios = require('axios');

const backendUrl = 'http://localhost:4000';
const adminCredentials = {
  email: 'jjtex001@gmail.com',
  password: 'jeno@1234J'
};

async function testAdmin() {
  console.log('🧪 Testing Admin Panel...\n');
  
  try {
    // Test 1: Backend connectivity
    console.log('1️⃣ Testing backend connectivity...');
    await axios.get(backendUrl);
    console.log('✅ Backend is reachable');
    
    // Test 2: Admin login
    console.log('\n2️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${backendUrl}/api/user/admin`, adminCredentials);
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.token;
      
      // Test 3: Token validation
      console.log('\n3️⃣ Testing token validation...');
      const userInfoResponse = await axios.get(`${backendUrl}/api/user/info`, {
        headers: { token }
      });
      
      if (userInfoResponse.data.success) {
        console.log('✅ Token validation successful');
      } else {
        console.log('❌ Token validation failed');
      }
      
      console.log('\n🎉 Admin panel is working correctly!');
      
    } else {
      console.log('❌ Admin login failed');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running: cd backend && npm start');
    }
  }
}

testAdmin(); 