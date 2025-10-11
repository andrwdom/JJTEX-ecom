#!/usr/bin/env node

/**
 * Production Test Suite for BackendV2
 * Comprehensive testing for production deployment
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    retries: 3,
    concurrent: 5
};

// Test results
const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
    performance: {},
    startTime: performance.now()
};

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Helper functions
const log = (message, color = colors.reset) => {
    console.log(`${color}${message}${colors.reset}`);
};

const logTest = (name, status, duration, error = null) => {
    const statusColor = status === 'PASSED' ? colors.green : status === 'FAILED' ? colors.red : colors.yellow;
    const durationStr = duration ? ` (${duration.toFixed(2)}ms)` : '';
    log(`${statusColor}${status}${colors.reset}: ${name}${durationStr}`);
    
    if (error) {
        log(`   ${colors.red}Error: ${error}${colors.reset}`);
    }
    
    results.tests.push({ name, status, duration, error });
    results[status.toLowerCase()]++;
};

// Test helper function
const runTest = async (name, testFn, options = {}) => {
    const startTime = performance.now();
    
    try {
        log(`⏳ Testing: ${name}`);
        await testFn();
        const duration = performance.now() - startTime;
        logTest(name, 'PASSED', duration);
        
        // Store performance data
        if (!results.performance[name]) {
            results.performance[name] = [];
        }
        results.performance[name].push(duration);
        
    } catch (error) {
        const duration = performance.now() - startTime;
        logTest(name, 'FAILED', duration, error.message);
    }
};

// HTTP client with retry logic
const httpClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: TEST_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JJTEX-Production-Test-Suite/1.0'
    }
});

// Add retry interceptor
httpClient.interceptors.response.use(
    response => response,
    async error => {
        const config = error.config;
        if (!config || !config.retry) {
            config.retry = 0;
        }
        
        if (config.retry < TEST_CONFIG.retries && error.response?.status >= 500) {
            config.retry++;
            await new Promise(resolve => setTimeout(resolve, 1000 * config.retry));
            return httpClient(config);
        }
        
        throw error;
    }
);

// Test 1: Basic Health Check
await runTest('Basic Health Check', async () => {
    const response = await httpClient.get('/api/health');
    
    if (response.status !== 200) {
        throw new Error(`Health check returned status ${response.status}`);
    }
    
    const data = response.data;
    if (!data.status) {
        throw new Error('Health check response missing status field');
    }
    
    if (data.database !== 'connected') {
        throw new Error(`Database not connected: ${data.database}`);
    }
    
    if (data.redis !== 'connected') {
        console.warn('Redis not connected - caching features may not work optimally');
    }
});

// Test 2: API Endpoints Availability
await runTest('API Endpoints Availability', async () => {
    const endpoints = [
        '/api/products',
        '/api/categories',
        '/api/carousel',
        '/api/product/list', // Legacy endpoint
        '/api/cart/get-items',
        '/api/orders/user'
    ];
    
    const promises = endpoints.map(async endpoint => {
        try {
            const response = await httpClient.get(endpoint);
            if (response.status >= 400) {
                throw new Error(`${endpoint} returned status ${response.status}`);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                // Auth required endpoints are expected to return 401
                return;
            }
            throw new Error(`${endpoint} failed: ${error.message}`);
        }
    });
    
    await Promise.all(promises);
});

// Test 3: CORS Configuration
await runTest('CORS Configuration', async () => {
    try {
        const response = await httpClient.options('/api/health', {
            headers: {
                'Origin': FRONTEND_URL,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        });
        
        const headers = response.headers;
        if (!headers['access-control-allow-origin']) {
            throw new Error('CORS headers not properly configured');
        }
        
        if (!headers['access-control-allow-methods']) {
            throw new Error('CORS methods not configured');
        }
        
    } catch (error) {
        if (error.response?.status === 403) {
            throw new Error('CORS blocking legitimate origin');
        }
        throw error;
    }
});

// Test 4: Rate Limiting
await runTest('Rate Limiting', async () => {
    const requests = Array(20).fill().map(() => 
        httpClient.get('/api/health').catch(err => err.response)
    );
    
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r && r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r && r.status === 429).length;
    
    if (successCount < 10) {
        throw new Error(`Rate limiting too aggressive: only ${successCount}/20 requests succeeded`);
    }
    
    if (rateLimitedCount === 0) {
        console.warn('Rate limiting may not be properly configured');
    }
});

// Test 5: Security Headers
await runTest('Security Headers', async () => {
    const response = await httpClient.get('/api/health');
    const headers = response.headers;
    
    const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
});

// Test 6: Database Performance
await runTest('Database Performance', async () => {
    const startTime = performance.now();
    
    // Test products endpoint performance
    const response = await httpClient.get('/api/products?limit=50');
    
    const duration = performance.now() - startTime;
    
    if (duration > 2000) {
        throw new Error(`Database query too slow: ${duration.toFixed(2)}ms`);
    }
    
    if (!response.data.success) {
        throw new Error('Products endpoint failed');
    }
    
    if (!response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Products endpoint returned invalid data format');
    }
});

// Test 7: Cache Performance
await runTest('Cache Performance', async () => {
    try {
        // First request (cache miss)
        const startTime1 = performance.now();
        await httpClient.get('/api/products?limit=20');
        const duration1 = performance.now() - startTime1;
        
        // Second request (cache hit)
        const startTime2 = performance.now();
        await httpClient.get('/api/products?limit=20');
        const duration2 = performance.now() - startTime2;
        
        // Cache should improve performance
        if (duration2 >= duration1) {
            console.warn('Cache may not be working optimally');
        }
        
        // Check cache stats endpoint
        try {
            const cacheResponse = await httpClient.get('/api/cache/stats');
            if (cacheResponse.data && cacheResponse.data.success) {
                log(`   Cache stats: ${JSON.stringify(cacheResponse.data.data)}`);
            }
        } catch (error) {
            console.warn('Cache stats endpoint not available');
        }
        
    } catch (error) {
        throw new Error(`Cache performance test failed: ${error.message}`);
    }
});

// Test 8: Memory Usage
await runTest('Memory Usage', async () => {
    const response = await httpClient.get('/api/health');
    const memory = response.data.memory;
    
    if (!memory) {
        throw new Error('Memory usage data not available');
    }
    
    const heapUsedMB = memory.heapUsed || 0;
    const heapTotalMB = memory.heapTotal || 0;
    
    if (heapUsedMB > 500) {
        console.warn(`High memory usage: ${heapUsedMB}MB`);
    }
    
    if (heapTotalMB > 1000) {
        console.warn(`High total heap: ${heapTotalMB}MB`);
    }
});

// Test 9: Error Handling
await runTest('Error Handling', async () => {
    // Test 404 error
    try {
        await httpClient.get('/api/nonexistent-endpoint');
        throw new Error('Expected 404 error');
    } catch (error) {
        if (error.response?.status !== 404) {
            throw new Error(`Expected 404, got ${error.response?.status}`);
        }
    }
    
    // Test invalid data
    try {
        await httpClient.post('/api/cart/add', { invalid: 'data' });
    } catch (error) {
        if (error.response?.status !== 400 && error.response?.status !== 401) {
            throw new Error(`Expected 400/401, got ${error.response?.status}`);
        }
    }
});

// Test 10: Payment System Health
await runTest('Payment System Health', async () => {
    try {
        // Test payment endpoints availability
        await httpClient.get('/api/payment/status/invalid-session');
    } catch (error) {
        if (error.response?.status !== 404 && error.response?.status !== 400) {
            throw new Error(`Payment endpoint error: ${error.response?.status}`);
        }
    }
    
    // Test checkout endpoints
    try {
        await httpClient.get('/api/checkout/invalid-session');
    } catch (error) {
        if (error.response?.status !== 404 && error.response?.status !== 400) {
            throw new Error(`Checkout endpoint error: ${error.response?.status}`);
        }
    }
});

// Test 11: Stock System Health
await runTest('Stock System Health', async () => {
    try {
        // Test stock endpoints
        const response = await httpClient.get('/api/products?limit=1');
        if (response.data.success && response.data.data.length > 0) {
            const product = response.data.data[0];
            if (product.sizes && Array.isArray(product.sizes)) {
                // Verify stock data structure
                product.sizes.forEach(size => {
                    if (typeof size.stock !== 'number') {
                        throw new Error('Invalid stock data structure');
                    }
                });
            }
        }
    } catch (error) {
        throw new Error(`Stock system test failed: ${error.message}`);
    }
});

// Test 12: Load Testing
await runTest('Load Testing', async () => {
    const concurrentRequests = 10;
    const requestsPerSecond = 5;
    const testDuration = 5000; // 5 seconds
    
    const startTime = performance.now();
    const requests = [];
    
    // Generate requests
    for (let i = 0; i < concurrentRequests * requestsPerSecond * (testDuration / 1000); i++) {
        requests.push(
            httpClient.get('/api/health')
                .then(response => ({ success: true, status: response.status }))
                .catch(error => ({ success: false, status: error.response?.status, error: error.message }))
        );
    }
    
    const results = await Promise.all(requests);
    const duration = performance.now() - startTime;
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const successRate = (successCount / results.length) * 100;
    
    if (successRate < 95) {
        throw new Error(`Low success rate: ${successRate.toFixed(2)}% (${failureCount} failures)`);
    }
    
    log(`   Load test results: ${successCount} successful, ${failureCount} failed (${successRate.toFixed(2)}% success rate)`);
});

// Test 13: Authentication Flow
await runTest('Authentication Flow', async () => {
    // Test protected endpoint without auth
    try {
        await httpClient.get('/api/orders/user');
        throw new Error('Expected 401 error for protected endpoint');
    } catch (error) {
        if (error.response?.status !== 401) {
            throw new Error(`Expected 401, got ${error.response?.status}`);
        }
    }
    
    // Test user registration endpoint availability
    try {
        await httpClient.post('/api/user/register', {
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpassword123'
        });
    } catch (error) {
        if (error.response?.status !== 400 && error.response?.status !== 409) {
            throw new Error(`Registration endpoint error: ${error.response?.status}`);
        }
    }
});

// Test 14: Data Validation
await runTest('Data Validation', async () => {
    // Test products endpoint data structure
    const response = await httpClient.get('/api/products?limit=5');
    
    if (response.data.success && response.data.data) {
        const products = response.data.data;
        
        products.forEach((product, index) => {
            if (!product._id || !product.name || typeof product.price !== 'number') {
                throw new Error(`Invalid product data at index ${index}`);
            }
            
            if (product.sizes && !Array.isArray(product.sizes)) {
                throw new Error(`Invalid sizes data for product ${product.name}`);
            }
        });
    }
});

// Test 15: Monitoring Endpoints
await runTest('Monitoring Endpoints', async () => {
    const monitoringEndpoints = [
        '/api/health',
        '/api/system-monitoring/status',
        '/api/monitoring/health'
    ];
    
    for (const endpoint of monitoringEndpoints) {
        try {
            const response = await httpClient.get(endpoint);
            if (response.status >= 400) {
                throw new Error(`${endpoint} returned status ${response.status}`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.warn(`Monitoring endpoint ${endpoint} not available`);
                continue;
            }
            throw error;
        }
    }
});

// Print Results
const totalDuration = performance.now() - results.startTime;

console.log('');
log('📊 Production Test Suite Results', colors.bold + colors.blue);
log('=' * 50, colors.blue);

log(`✅ Passed: ${results.passed}`, colors.green);
log(`❌ Failed: ${results.failed}`, colors.red);
log(`⏭️  Skipped: ${results.skipped}`, colors.yellow);
log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`, colors.cyan);

console.log('');
log('📈 Performance Summary:', colors.bold + colors.magenta);

Object.entries(results.performance).forEach(([testName, durations]) => {
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    log(`   ${testName}:`, colors.cyan);
    log(`     Average: ${avgDuration.toFixed(2)}ms`);
    log(`     Min: ${minDuration.toFixed(2)}ms`);
    log(`     Max: ${maxDuration.toFixed(2)}ms`);
});

console.log('');
if (results.failed === 0) {
    log('🎉 All tests passed! BackendV2 is production-ready.', colors.bold + colors.green);
    log('✅ System is ready for deployment.', colors.green);
} else {
    log('⚠️  Some tests failed. Please address the issues before deployment.', colors.bold + colors.red);
    log('❌ System is not ready for production deployment.', colors.red);
}

console.log('');
log('🔧 Production Readiness Checklist:', colors.bold + colors.blue);
log('   □ All tests passing');
log('   □ Environment variables configured');
log('   □ SSL certificates installed');
log('   □ Redis server running');
log('   □ MongoDB optimized');
log('   □ PM2 configured');
log('   □ Nginx configured');
log('   □ Monitoring setup');
log('   □ Backup strategy implemented');
log('   □ Log rotation configured');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
