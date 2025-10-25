#!/usr/bin/env node

/**
 * 🚀 ULTRA-FAST ENDPOINTS TEST SCRIPT
 * 
 * This script tests all ultra-fast endpoints to ensure they're working:
 * 1. Tests /api/products/ultra-fast
 * 2. Tests /api/products/instant
 * 3. Tests /api/products/preload
 * 4. Tests /api/products/search-instant
 * 5. Validates response times and data
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/products`;

// Test configuration
const TESTS = [
    {
        name: 'Ultra-Fast Products',
        endpoint: '/ultra-fast',
        expectedFields: ['success', 'products'],
        maxResponseTime: 500
    },
    {
        name: 'Instant Products',
        endpoint: '/instant',
        expectedFields: ['success', 'products'],
        maxResponseTime: 200
    },
    {
        name: 'Preload Products',
        endpoint: '/preload',
        params: { categorySlug: 'all', limit: 10 },
        expectedFields: ['success', 'products'],
        maxResponseTime: 300
    },
    {
        name: 'Search Instant',
        endpoint: '/search-instant',
        params: { q: 'shirt', limit: 5 },
        expectedFields: ['success', 'products', 'query'],
        maxResponseTime: 200
    }
];

async function testEndpoint(test) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📍 Endpoint: ${test.endpoint}`);
    
    const startTime = Date.now();
    
    try {
        const response = await axios.get(`${API_URL}${test.endpoint}`, {
            params: test.params || {},
            timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        
        // Check response time
        const timeStatus = responseTime <= test.maxResponseTime ? '✅' : '⚠️';
        console.log(`${timeStatus} Response time: ${responseTime}ms (max: ${test.maxResponseTime}ms)`);
        
        // Check status code
        const statusStatus = response.status === 200 ? '✅' : '❌';
        console.log(`${statusStatus} Status code: ${response.status}`);
        
        // Check response data
        const data = response.data;
        const dataStatus = data && typeof data === 'object' ? '✅' : '❌';
        console.log(`${dataStatus} Response data: ${data ? 'Valid' : 'Invalid'}`);
        
        // Check expected fields
        let fieldsStatus = '✅';
        if (test.expectedFields) {
            for (const field of test.expectedFields) {
                if (!(field in data)) {
                    fieldsStatus = '❌';
                    break;
                }
            }
        }
        console.log(`${fieldsStatus} Expected fields: ${test.expectedFields?.join(', ') || 'None'}`);
        
        // Check products array
        const productsStatus = Array.isArray(data.products) ? '✅' : '❌';
        const productsCount = Array.isArray(data.products) ? data.products.length : 0;
        console.log(`${productsStatus} Products array: ${productsCount} products`);
        
        // Performance rating
        let performanceRating = 'Excellent';
        if (responseTime > test.maxResponseTime) {
            performanceRating = 'Poor';
        } else if (responseTime > test.maxResponseTime * 0.7) {
            performanceRating = 'Good';
        } else if (responseTime > test.maxResponseTime * 0.5) {
            performanceRating = 'Very Good';
        }
        
        console.log(`📊 Performance: ${performanceRating}`);
        
        return {
            name: test.name,
            success: response.status === 200 && data && Array.isArray(data.products),
            responseTime,
            productsCount,
            performanceRating,
            data: {
                success: data.success,
                total: data.total || data.products?.length || 0,
                cached: data.cached || false,
                responseTime: data.responseTime || `${responseTime}ms`
            }
        };
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.log(`❌ Error: ${error.message}`);
        console.log(`⏱️  Failed after: ${responseTime}ms`);
        
        return {
            name: test.name,
            success: false,
            responseTime,
            productsCount: 0,
            performanceRating: 'Failed',
            error: error.message
        };
    }
}

async function runAllTests() {
    console.log('🚀 ULTRA-FAST ENDPOINTS TEST SUITE');
    console.log('='.repeat(50));
    console.log(`🌐 Testing against: ${BASE_URL}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    
    const results = [];
    
    for (const test of TESTS) {
        const result = await testEndpoint(test);
        results.push(result);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
    console.log(`❌ Failed tests: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log('\n✅ Successful endpoints:');
        successful.forEach(result => {
            console.log(`  • ${result.name}: ${result.responseTime}ms (${result.performanceRating})`);
            console.log(`    Products: ${result.productsCount}, Cached: ${result.data.cached}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ Failed endpoints:');
        failed.forEach(result => {
            console.log(`  • ${result.name}: ${result.error || 'Unknown error'}`);
        });
    }
    
    // Performance analysis
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const fastestTest = results.reduce((min, r) => r.responseTime < min.responseTime ? r : min);
    const slowestTest = results.reduce((max, r) => r.responseTime > max.responseTime ? r : max);
    
    console.log('\n📈 Performance Analysis:');
    console.log(`  • Average response time: ${Math.round(avgResponseTime)}ms`);
    console.log(`  • Fastest endpoint: ${fastestTest.name} (${fastestTest.responseTime}ms)`);
    console.log(`  • Slowest endpoint: ${slowestTest.name} (${slowestTest.responseTime}ms)`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (avgResponseTime < 100) {
        console.log('  🚀 Excellent performance! Your endpoints are optimized for Amazon-level speed.');
    } else if (avgResponseTime < 300) {
        console.log('  ✅ Good performance! Consider caching optimizations for even better speed.');
    } else if (avgResponseTime < 500) {
        console.log('  ⚠️  Fair performance. Consider database optimization and caching.');
    } else {
        console.log('  ❌ Poor performance. Immediate optimization required.');
    }
    
    if (failed.length > 0) {
        console.log('  🔧 Fix failed endpoints before deploying to production.');
    }
    
    console.log('\n🎉 Test suite completed!');
    
    return {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        avgResponseTime: Math.round(avgResponseTime),
        results
    };
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export { runAllTests, testEndpoint };
