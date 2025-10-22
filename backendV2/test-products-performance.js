#!/usr/bin/env node

/**
 * Products API Performance Test
 * Tests the products endpoint for response time and caching
 */

import axios from 'axios';

const API_BASE = 'https://api.jjtextiles.com';
const ENDPOINTS = {
    health: '/api/products/health',
    products: '/api/products',
    productsWithCache: '/api/products?limit=50'
};

async function testEndpoint(name, url, iterations = 3) {
    console.log(`\n🧪 Testing ${name}...`);
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
        try {
            const start = Date.now();
            const response = await axios.get(`${API_BASE}${url}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'JJTEX-Performance-Test/1.0'
                }
            });
            const duration = Date.now() - start;
            
            times.push(duration);
            console.log(`  Attempt ${i + 1}: ${duration}ms (Status: ${response.status})`);
            
            // Check for cache headers
            if (response.headers['x-cache-status']) {
                console.log(`  Cache Status: ${response.headers['x-cache-status']}`);
            }
            
        } catch (error) {
            console.error(`  Attempt ${i + 1} failed:`, error.message);
        }
        
        // Wait between requests
        if (i < iterations - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        console.log(`  📊 Results: Avg: ${avg.toFixed(0)}ms, Min: ${min}ms, Max: ${max}ms`);
        
        // Performance assessment
        if (avg < 500) {
            console.log(`  ✅ Excellent performance`);
        } else if (avg < 1000) {
            console.log(`  ⚠️  Good performance`);
        } else if (avg < 2000) {
            console.log(`  ⚠️  Acceptable performance`);
        } else {
            console.log(`  ❌ Poor performance - needs optimization`);
        }
    }
}

async function runTests() {
    console.log('🚀 Starting Products API Performance Tests...');
    console.log(`📍 Testing against: ${API_BASE}`);
    
    try {
        // Test health endpoint
        await testEndpoint('Health Check', ENDPOINTS.health, 2);
        
        // Test products endpoint
        await testEndpoint('Products API (First Load)', ENDPOINTS.products, 1);
        
        // Test products endpoint again (should hit cache)
        await testEndpoint('Products API (Cached)', ENDPOINTS.products, 3);
        
        // Test with parameters
        await testEndpoint('Products API (With Params)', ENDPOINTS.productsWithCache, 2);
        
        console.log('\n✅ Performance tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();
