#!/usr/bin/env node

/**
 * 🏥 SERVER HEALTH CHECK SCRIPT
 * 
 * This script diagnoses server issues:
 * 1. Checks server connectivity
 * 2. Tests database connection
 * 3. Tests Redis connection
 * 4. Checks memory and CPU usage
 * 5. Provides fix recommendations
 */

import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
dotenv.config();

const SERVER_URL = process.env.BASE_URL || 'https://api.jjtextiles.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shithaa-ecom';

// =====================================================================================
// 🏥 HEALTH CHECK FUNCTIONS
// =====================================================================================

async function checkServerConnectivity() {
    console.log('🌐 Checking server connectivity...');
    
    const endpoints = [
        '/api/products/health',
        '/api/products/fast',
        '/api/products',
        '/api/cors-test'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            const response = await axios.get(`${SERVER_URL}${endpoint}`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const responseTime = Date.now() - startTime;
            
            results.push({
                endpoint,
                status: response.status,
                responseTime,
                success: true,
                data: response.data
            });
            
            console.log(`✅ ${endpoint}: ${response.status} (${responseTime}ms)`);
            
        } catch (error) {
            results.push({
                endpoint,
                status: error.response?.status || 'ERROR',
                responseTime: 0,
                success: false,
                error: error.message
            });
            
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
    
    return results;
}

async function checkDatabaseConnection() {
    console.log('\n🗄️ Checking database connection...');
    
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        console.log('✅ Database connected successfully');
        
        // Test a simple query
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections`);
        
        // Test products collection
        const productsCount = await db.collection('products').countDocuments();
        console.log(`📦 Products in database: ${productsCount}`);
        
        await mongoose.disconnect();
        console.log('🔌 Database disconnected');
        
        return {
            success: true,
            collections: collections.length,
            productsCount
        };
        
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

async function checkRedisConnection() {
    console.log('\n🔴 Checking Redis connection...');
    
    try {
        // Try to connect to Redis
        const { default: Redis } = await import('ioredis');
        
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            connectTimeout: 5000,
            lazyConnect: true
        });
        
        await redis.ping();
        console.log('✅ Redis connected successfully');
        
        const info = await redis.info('memory');
        const dbSize = await redis.dbsize();
        
        console.log(`📊 Redis DB size: ${dbSize} keys`);
        console.log(`💾 Redis memory: ${info.split('\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1] || 'Unknown'}`);
        
        await redis.quit();
        
        return {
            success: true,
            dbSize,
            memory: info
        };
        
    } catch (error) {
        console.log(`❌ Redis connection failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

async function checkSystemResources() {
    console.log('\n💻 Checking system resources...');
    
    try {
        // Check memory usage
        const { stdout: memoryInfo } = await execAsync('free -h');
        console.log('📊 Memory usage:');
        console.log(memoryInfo);
        
        // Check disk space
        const { stdout: diskInfo } = await execAsync('df -h');
        console.log('💾 Disk usage:');
        console.log(diskInfo);
        
        // Check if PM2 is running
        try {
            const { stdout: pm2Info } = await execAsync('pm2 list');
            console.log('🔄 PM2 processes:');
            console.log(pm2Info);
        } catch (pm2Error) {
            console.log('⚠️ PM2 not found or not running');
        }
        
        return {
            success: true,
            memory: memoryInfo,
            disk: diskInfo
        };
        
    } catch (error) {
        console.log(`❌ System check failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

async function checkProcessStatus() {
    console.log('\n🔄 Checking process status...');
    
    try {
        // Check if Node.js processes are running
        const { stdout: nodeProcesses } = await execAsync('ps aux | grep node | grep -v grep');
        
        if (nodeProcesses.trim()) {
            console.log('✅ Node.js processes found:');
            console.log(nodeProcesses);
        } else {
            console.log('❌ No Node.js processes found');
        }
        
        // Check if the server port is in use
        const { stdout: portCheck } = await execAsync('netstat -tlnp | grep :5000 || echo "Port 5000 not in use"');
        console.log('🔌 Port 5000 status:');
        console.log(portCheck);
        
        return {
            success: true,
            processes: nodeProcesses,
            port: portCheck
        };
        
    } catch (error) {
        console.log(`❌ Process check failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// =====================================================================================
// 🎯 MAIN HEALTH CHECK
// =====================================================================================

async function runHealthCheck() {
    console.log('🏥 SERVER HEALTH CHECK');
    console.log('='.repeat(50));
    console.log(`🌐 Server URL: ${SERVER_URL}`);
    console.log(`🗄️ Database: ${MONGODB_URI.split('@')[1] || 'localhost'}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    
    const results = {
        connectivity: null,
        database: null,
        redis: null,
        system: null,
        processes: null
    };
    
    try {
        // 1. Check server connectivity
        results.connectivity = await checkServerConnectivity();
        
        // 2. Check database
        results.database = await checkDatabaseConnection();
        
        // 3. Check Redis
        results.redis = await checkRedisConnection();
        
        // 4. Check system resources
        results.system = await checkSystemResources();
        
        // 5. Check process status
        results.processes = await checkProcessStatus();
        
    } catch (error) {
        console.error('❌ Health check failed:', error);
    }
    
    // Generate report
    console.log('\n' + '='.repeat(50));
    console.log('📊 HEALTH CHECK REPORT');
    console.log('='.repeat(50));
    
    // Connectivity report
    const successfulEndpoints = results.connectivity?.filter(r => r.success) || [];
    const failedEndpoints = results.connectivity?.filter(r => !r.success) || [];
    
    console.log(`🌐 Server Connectivity: ${successfulEndpoints.length}/${results.connectivity?.length || 0} endpoints working`);
    
    if (failedEndpoints.length > 0) {
        console.log('❌ Failed endpoints:');
        failedEndpoints.forEach(endpoint => {
            console.log(`  • ${endpoint.endpoint}: ${endpoint.error}`);
        });
    }
    
    // Database report
    console.log(`🗄️ Database: ${results.database?.success ? '✅ Connected' : '❌ Failed'}`);
    if (results.database?.success) {
        console.log(`  • Collections: ${results.database.collections}`);
        console.log(`  • Products: ${results.database.productsCount}`);
    }
    
    // Redis report
    console.log(`🔴 Redis: ${results.redis?.success ? '✅ Connected' : '❌ Failed'}`);
    if (results.redis?.success) {
        console.log(`  • Keys: ${results.redis.dbSize}`);
    }
    
    // System report
    console.log(`💻 System: ${results.system?.success ? '✅ OK' : '❌ Issues'}`);
    
    // Process report
    console.log(`🔄 Processes: ${results.processes?.success ? '✅ Running' : '❌ Not found'}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (failedEndpoints.length > 0) {
        console.log('🚨 CRITICAL: Server is not responding');
        console.log('  • Restart your backend server: pm2 restart backendV2');
        console.log('  • Check server logs: pm2 logs backendV2');
        console.log('  • Verify server is running on the correct port');
    }
    
    if (!results.database?.success) {
        console.log('🗄️ DATABASE ISSUE:');
        console.log('  • Check MongoDB is running: systemctl status mongod');
        console.log('  • Verify connection string in .env file');
        console.log('  • Check database permissions');
    }
    
    if (!results.redis?.success) {
        console.log('🔴 REDIS ISSUE:');
        console.log('  • Check Redis is running: systemctl status redis');
        console.log('  • Verify Redis configuration');
        console.log('  • Check Redis memory usage');
    }
    
    if (!results.processes?.success) {
        console.log('🔄 PROCESS ISSUE:');
        console.log('  • Start your backend: pm2 start backendV2');
        console.log('  • Check if port 5000 is available');
        console.log('  • Verify your server configuration');
    }
    
    // Quick fixes
    console.log('\n🔧 QUICK FIXES:');
    console.log('1. Restart everything:');
    console.log('   pm2 restart all');
    console.log('   systemctl restart mongod');
    console.log('   systemctl restart redis');
    
    console.log('\n2. Check logs:');
    console.log('   pm2 logs backendV2 --lines 50');
    console.log('   journalctl -u mongod -n 20');
    console.log('   journalctl -u redis -n 20');
    
    console.log('\n3. Test manually:');
    console.log(`   curl -I ${SERVER_URL}/api/products/health`);
    console.log('   curl -I http://localhost:5000/api/products/health');
    
    return results;
}

// Run health check
if (import.meta.url === `file://${process.argv[1]}`) {
    runHealthCheck().catch(console.error);
}

export { runHealthCheck };
