#!/usr/bin/env node

/**
 * 🚀 JJTEX PERFORMANCE OPTIMIZATION SCRIPT
 * 
 * This script optimizes the JJTEX database for maximum performance
 * by creating the same indexes used in shithaa.in
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jjtextiles';

// =====================================================================================
// 🎯 AMAZON-LEVEL INDEX STRATEGY FOR JJTEX
// =====================================================================================

const JJTEX_OPTIMIZED_INDEXES = {
    products: [
        // 1. UNIQUE CONSTRAINTS (Critical for data integrity)
        {
            key: { customId: 1 },
            options: { 
                unique: true, 
                name: 'customId_unique',
                background: true,
                sparse: false
            }
        },

        // 2. PRIMARY QUERY PATTERNS - Single Field Indexes
        {
            key: { categorySlug: 1 },
            options: { 
                name: 'categorySlug_1',
                background: true
            }
        },
        {
            key: { category: 1 },
            options: { 
                name: 'category_1',
                background: true
            }
        },
        {
            key: { price: 1 },
            options: { 
                name: 'price_1',
                background: true
            }
        },
        {
            key: { inStock: 1 },
            options: { 
                name: 'inStock_1',
                background: true
            }
        },
        {
            key: { isNewArrival: 1 },
            options: { 
                name: 'isNewArrival_1',
                background: true
            }
        },
        {
            key: { isBestSeller: 1 },
            options: { 
                name: 'isBestSeller_1',
                background: true
            }
        },
        {
            key: { sleeveType: 1 },
            options: { 
                name: 'sleeveType_1',
                background: true
            }
        },

        // 3. NESTED FIELD INDEXES - Size and Stock Management
        {
            key: { 'sizes.size': 1 },
            options: { 
                name: 'sizes.size_1',
                background: true
            }
        },
        {
            key: { 'sizes.stock': 1 },
            options: { 
                name: 'sizes.stock_1',
                background: true
            }
        },

        // 4. SORTING INDEXES
        {
            key: { createdAt: -1 },
            options: { 
                name: 'createdAt_-1',
                background: true
            }
        },
        {
            key: { displayOrder: 1 },
            options: { 
                name: 'displayOrder_1',
                background: true
            }
        },
        {
            key: { updatedAt: -1 },
            options: { 
                name: 'updatedAt_-1',
                background: true
            }
        },

        // 5. COMPOUND INDEXES (Critical for Performance)
        // Category + Filter combinations
        {
            key: { categorySlug: 1, inStock: 1 },
            options: { 
                name: 'categorySlug_1_inStock_1',
                background: true
            }
        },
        {
            key: { categorySlug: 1, price: 1 },
            options: { 
                name: 'categorySlug_1_price_1',
                background: true
            }
        },
        {
            key: { categorySlug: 1, isNewArrival: 1 },
            options: { 
                name: 'categorySlug_1_isNewArrival_1',
                background: true
            }
        },
        {
            key: { categorySlug: 1, isBestSeller: 1 },
            options: { 
                name: 'categorySlug_1_isBestSeller_1',
                background: true
            }
        },
        {
            key: { categorySlug: 1, sleeveType: 1 },
            options: { 
                name: 'categorySlug_1_sleeveType_1',
                background: true
            }
        },

        // Filter + Sort combinations
        {
            key: { inStock: 1, price: 1 },
            options: { 
                name: 'inStock_1_price_1',
                background: true
            }
        },
        {
            key: { isNewArrival: 1, createdAt: -1 },
            options: { 
                name: 'isNewArrival_1_createdAt_-1',
                background: true
            }
        },
        {
            key: { isBestSeller: 1, createdAt: -1 },
            options: { 
                name: 'isBestSeller_1_createdAt_-1',
                background: true
            }
        },

        // Size + Stock combinations
        {
            key: { 'sizes.size': 1, 'sizes.stock': 1 },
            options: { 
                name: 'sizes.size_1_sizes.stock_1',
                background: true
            }
        },
        {
            key: { categorySlug: 1, 'sizes.size': 1 },
            options: { 
                name: 'categorySlug_1_sizes.size_1',
                background: true
            }
        },

        // Display order combinations
        {
            key: { displayOrder: 1, categorySlug: 1 },
            options: { 
                name: 'displayOrder_1_categorySlug_1',
                background: true
            }
        },
        {
            key: { displayOrder: 1, inStock: 1 },
            options: { 
                name: 'displayOrder_1_inStock_1',
                background: true
            }
        },

        // 6. ULTRA-FAST QUERY INDEXES
        {
            key: { inStock: 1, displayOrder: 1, createdAt: -1 },
            options: { 
                name: 'inStock_1_displayOrder_1_createdAt_-1',
                background: true
            }
        },
        {
            key: { categorySlug: 1, inStock: 1, displayOrder: 1 },
            options: { 
                name: 'categorySlug_1_inStock_1_displayOrder_1',
                background: true
            }
        },

        // 7. TEXT SEARCH INDEX
        {
            key: { 
                name: 'text',
                description: 'text',
                customId: 'text'
            },
            options: { 
                name: 'text_search',
                background: true,
                weights: {
                    name: 10,
                    customId: 8,
                    description: 1
                }
            }
        }
    ],

    orders: [
        {
            key: { userId: 1, createdAt: -1 },
            options: { 
                name: 'userId_1_createdAt_-1',
                background: true
            }
        },
        {
            key: { status: 1, createdAt: -1 },
            options: { 
                name: 'status_1_createdAt_-1',
                background: true
            }
        },
        {
            key: { orderId: 1 },
            options: { 
                name: 'orderId_1',
                background: true,
                unique: true,
                sparse: true
            }
        }
    ],

    carts: [
        {
            key: { userId: 1 },
            options: { 
                name: 'userId_1',
                background: true
            }
        },
        {
            key: { userId: 1, updatedAt: -1 },
            options: { 
                name: 'userId_1_updatedAt_-1',
                background: true
            }
        }
    ],

    users: [
        {
            key: { email: 1 },
            options: { 
                name: 'email_1',
                background: true,
                unique: true,
                sparse: true
            }
        },
        {
            key: { phone: 1 },
            options: { 
                name: 'phone_1',
                background: true,
                sparse: true
            }
        }
    ]
};

async function optimizeJJTEXDatabase() {
    const startTime = performance.now();
    
    try {
        console.log('🚀 JJTEX Performance Optimization Starting...');
        console.log('🔧 Connecting to database:', MONGODB_URI);
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to JJTEX database');

        const db = mongoose.connection.db;
        
        // Get current collection stats
        const collections = await db.listCollections().toArray();
        console.log('📊 Found collections:', collections.map(c => c.name));

        // Optimize Products Collection
        console.log('\n🎯 Optimizing Products Collection...');
        const productsCollection = db.collection('products');
        
        // Get current indexes
        const currentIndexes = await productsCollection.indexes();
        console.log('📋 Current indexes:', currentIndexes.length);
        
        // Create optimized indexes
        for (const indexConfig of JJTEX_OPTIMIZED_INDEXES.products) {
            try {
                await productsCollection.createIndex(indexConfig.key, indexConfig.options);
                console.log(`✅ Created index: ${indexConfig.options.name}`);
            } catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️ Index already exists: ${indexConfig.options.name}`);
                } else {
                    console.error(`❌ Error creating index ${indexConfig.options.name}:`, error.message);
                }
            }
        }

        // Optimize Orders Collection
        console.log('\n🎯 Optimizing Orders Collection...');
        const ordersCollection = db.collection('orders');
        for (const indexConfig of JJTEX_OPTIMIZED_INDEXES.orders) {
            try {
                await ordersCollection.createIndex(indexConfig.key, indexConfig.options);
                console.log(`✅ Created index: ${indexConfig.options.name}`);
            } catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️ Index already exists: ${indexConfig.options.name}`);
                } else {
                    console.error(`❌ Error creating index ${indexConfig.options.name}:`, error.message);
                }
            }
        }

        // Optimize Carts Collection
        console.log('\n🎯 Optimizing Carts Collection...');
        const cartsCollection = db.collection('carts');
        for (const indexConfig of JJTEX_OPTIMIZED_INDEXES.carts) {
            try {
                await cartsCollection.createIndex(indexConfig.key, indexConfig.options);
                console.log(`✅ Created index: ${indexConfig.options.name}`);
            } catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️ Index already exists: ${indexConfig.options.name}`);
                } else {
                    console.error(`❌ Error creating index ${indexConfig.options.name}:`, error.message);
                }
            }
        }

        // Optimize Users Collection
        console.log('\n🎯 Optimizing Users Collection...');
        const usersCollection = db.collection('users');
        for (const indexConfig of JJTEX_OPTIMIZED_INDEXES.users) {
            try {
                await usersCollection.createIndex(indexConfig.key, indexConfig.options);
                console.log(`✅ Created index: ${indexConfig.options.name}`);
            } catch (error) {
                if (error.code === 85) {
                    console.log(`⚠️ Index already exists: ${indexConfig.options.name}`);
                } else {
                    console.error(`❌ Error creating index ${indexConfig.options.name}:`, error.message);
                }
            }
        }

        // Get final index stats
        console.log('\n📊 Final Index Statistics:');
        const finalProductsIndexes = await productsCollection.indexes();
        console.log(`Products collection: ${finalProductsIndexes.length} indexes`);

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log(`\n🎉 JJTEX Performance Optimization Complete!`);
        console.log(`⏱️ Total time: ${duration}ms`);
        console.log(`🚀 JJTEX should now perform at the same level as shithaa.in!`);

    } catch (error) {
        console.error('❌ Optimization failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

// Run optimization
optimizeJJTEXDatabase().catch(console.error);
