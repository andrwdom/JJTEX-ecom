#!/usr/bin/env node

/**
 * Test the fast products endpoint
 */

import axios from 'axios';

const API_BASE = 'https://api.jjtextiles.com';

async function testFastEndpoint() {
    console.log('🚀 Testing Fast Products Endpoint...');
    console.log(`📍 URL: ${API_BASE}/api/products/fast`);
    
    try {
        const start = Date.now();
        const response = await axios.get(`${API_BASE}/api/products/fast`, {
            timeout: 15000,
            headers: {
                'User-Agent': 'JJTEX-Fast-Test/1.0'
            }
        });
        const duration = Date.now() - start;
        
        console.log(`✅ Success! Response time: ${duration}ms`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📦 Products count: ${response.data.products?.length || 0}`);
        console.log(`⚡ Fast load: ${response.data.fastLoad}`);
        console.log(`🕒 Response time: ${response.data.responseTime}`);
        
        // Check cache headers
        if (response.headers['x-response-time']) {
            console.log(`⏱️  Server response time: ${response.headers['x-response-time']}`);
        }
        if (response.headers['x-cache-status']) {
            console.log(`💾 Cache status: ${response.headers['x-cache-status']}`);
        }
        
        // Check first product for image URLs
        if (response.data.products && response.data.products.length > 0) {
            const firstProduct = response.data.products[0];
            console.log(`\n🔍 First product sample:`);
            console.log(`   Name: ${firstProduct.name}`);
            console.log(`   Custom ID: ${firstProduct.customId}`);
            console.log(`   Images: ${firstProduct.images?.length || 0} images`);
            if (firstProduct.images && firstProduct.images.length > 0) {
                console.log(`   First image URL: ${firstProduct.images[0]}`);
                console.log(`   Image path correct: ${firstProduct.images[0].startsWith('/uploads/') ? '✅' : '❌'}`);
            }
        }
        
        // Performance assessment
        if (duration < 1000) {
            console.log(`\n🎉 Excellent performance! Under 1 second`);
        } else if (duration < 2000) {
            console.log(`\n✅ Good performance! Under 2 seconds`);
        } else if (duration < 5000) {
            console.log(`\n⚠️  Acceptable performance`);
        } else {
            console.log(`\n❌ Poor performance - needs optimization`);
        }
        
    } catch (error) {
        console.error(`❌ Test failed:`, error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
    }
}

// Run test
testFastEndpoint();
