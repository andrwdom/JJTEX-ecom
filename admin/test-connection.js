// Test script to verify admin panel connectivity
const axios = require('axios');

const backendUrl = process.env.VITE_API_URL || 'http://localhost:4000';

async function testConnection() {
    console.log('Testing admin panel connectivity...');
    console.log('Backend URL:', backendUrl);
    
    try {
        // Test basic connectivity
        console.log('\n1. Testing basic connectivity...');
        const response = await axios.get(backendUrl);
        console.log('✅ Backend is reachable');
        
        // Test admin login endpoint
        console.log('\n2. Testing admin login endpoint...');
        const loginResponse = await axios.post(`${backendUrl}/api/user/admin`, {
            email: 'jjtex001@gmail.com',
            password: 'jeno@1234J'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Admin login endpoint working');
            console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
        } else {
            console.log('❌ Admin login failed:', loginResponse.data.message);
        }
        
        // Test product list endpoint
        console.log('\n3. Testing product list endpoint...');
        const productResponse = await axios.get(`${backendUrl}/api/product/list`);
        
        if (productResponse.data.success) {
            console.log('✅ Product list endpoint working');
            console.log('Products found:', productResponse.data.products?.length || 0);
        } else {
            console.log('❌ Product list failed:', productResponse.data.message);
        }
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the backend server is running on port 4000');
        } else if (error.response?.status === 404) {
            console.log('💡 Check if the backend URL is correct');
        }
    }
}

testConnection(); 