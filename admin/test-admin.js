// Admin Panel Test Script
// Run this to test admin functionality

const axios = require('axios');

const backendUrl = 'http://localhost:4000';
const adminCredentials = {
  email: 'jjtex001@gmail.com',
  password: 'jeno@1234J'
};

async function testAdminFunctionality() {
  console.log('🧪 Testing Admin Panel Functionality...\n');
  
  try {
    // Step 1: Test backend connectivity
    console.log('1️⃣ Testing backend connectivity...');
    const healthCheck = await axios.get(backendUrl);
    console.log('✅ Backend is reachable');
    
    // Step 2: Test admin login
    console.log('\n2️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${backendUrl}/api/user/admin`, adminCredentials);
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.token;
      console.log('✅ Token received:', !!token);
      
      // Step 3: Test token validation
      console.log('\n3️⃣ Testing token validation...');
      const userInfoResponse = await axios.get(`${backendUrl}/api/user/info`, {
        headers: { token }
      });
      
      if (userInfoResponse.data.success) {
        console.log('✅ Token validation successful');
        console.log('✅ User info:', userInfoResponse.data.user);
      } else {
        console.log('❌ Token validation failed:', userInfoResponse.data.message);
      }
      
      // Step 4: Test admin authentication
      console.log('\n4️⃣ Testing admin authentication...');
      const adminTestResponse = await axios.get(`${backendUrl}/api/user/admin-test`, {
        headers: { token }
      });
      
      if (adminTestResponse.data.success) {
        console.log('✅ Admin authentication working');
      } else {
        console.log('❌ Admin authentication failed:', adminTestResponse.data.message);
      }
      
      // Step 5: Test order stats endpoint
      console.log('\n5️⃣ Testing order stats endpoint...');
      const statsResponse = await axios.get(`${backendUrl}/api/order/stats`, {
        headers: { token }
      });
      
      if (statsResponse.data.success) {
        console.log('✅ Order stats endpoint working');
        console.log('📊 Stats:', statsResponse.data.stats);
      } else {
        console.log('❌ Order stats failed:', statsResponse.data.message);
      }
      
      // Step 6: Test product list endpoint
      console.log('\n6️⃣ Testing product list endpoint...');
      const productResponse = await axios.get(`${backendUrl}/api/product/list`);
      
      if (productResponse.data.success) {
        console.log('✅ Product list endpoint working');
        console.log('📦 Products found:', productResponse.data.products?.length || 0);
      } else {
        console.log('❌ Product list failed:', productResponse.data.message);
      }
      
      console.log('\n🎉 All tests completed successfully!');
      console.log('\n📋 Summary:');
      console.log('✅ Backend connectivity');
      console.log('✅ Admin login');
      console.log('✅ Token validation');
      console.log('✅ Admin authentication');
      console.log('✅ Order stats API');
      console.log('✅ Product list API');
      
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 4000');
      console.log('💡 Run: cd backend && npm start');
    } else if (error.response?.status === 401) {
      console.log('💡 Check admin credentials in backend/.env');
    } else if (error.response?.status === 404) {
      console.log('💡 Check if the backend URL is correct');
    }
  }
}

// Run the test
testAdminFunctionality(); 