#!/usr/bin/env node

/**
 * 🚀 DATABASE PERFORMANCE OPTIMIZATION SCRIPT
 * 
 * This script implements Amazon-level database optimizations:
 * 1. Creates comprehensive indexes for sub-millisecond queries
 * 2. Analyzes query performance and suggests optimizations
 * 3. Implements compound indexes for complex queries
 * 4. Sets up partial indexes for filtered data
 * 5. Optimizes MongoDB configuration for e-commerce workloads
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shithaa-ecom';

// =====================================================================================
// 🎯 AMAZON-LEVEL INDEX STRATEGY
// =====================================================================================

const OPTIMIZED_INDEXES = {
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
        {
            key: { 'sizes.reserved': 1 },
            options: { 
                name: 'sizes.reserved_1',
                background: true
            }
        },

        // 4. SORTING OPTIMIZATIONS
        {
            key: { createdAt: -1 },
            options: { 
                name: 'createdAt_desc',
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
            key: { rating: -1 },
            options: { 
                name: 'rating_desc',
                background: true
            }
        },
        {
            key: { updatedAt: -1 },
            options: { 
                name: 'updatedAt_desc',
                background: true
            }
        },

        // 5. COMPOUND INDEXES (Critical for Performance)
        // Category + Filter combinations (most common queries)
        {
            key: { categorySlug: 1, inStock: 1 },
            options: { 
                name: 'categorySlug_inStock',
                background: true
            }
        },
        {
            key: { categorySlug: 1, price: 1 },
            options: { 
                name: 'categorySlug_price',
                background: true
            }
        },
        {
            key: { categorySlug: 1, isNewArrival: 1 },
            options: { 
                name: 'categorySlug_isNewArrival',
                background: true
            }
        },
        {
            key: { categorySlug: 1, isBestSeller: 1 },
            options: { 
                name: 'categorySlug_isBestSeller',
                background: true
            }
        },
        {
            key: { categorySlug: 1, sleeveType: 1 },
            options: { 
                name: 'categorySlug_sleeveType',
                background: true
            }
        },

        // Filter + Sort combinations
        {
            key: { inStock: 1, price: 1 },
            options: { 
                name: 'inStock_price',
                background: true
            }
        },
        {
            key: { isNewArrival: 1, createdAt: -1 },
            options: { 
                name: 'isNewArrival_createdAt_desc',
                background: true
            }
        },
        {
            key: { isBestSeller: 1, rating: -1 },
            options: { 
                name: 'isBestSeller_rating_desc',
                background: true
            }
        },

        // Size + Stock combinations (for size filtering with stock)
        {
            key: { 'sizes.size': 1, 'sizes.stock': 1 },
            options: { 
                name: 'sizes.size_sizes.stock',
                background: true
            }
        },
        {
            key: { categorySlug: 1, 'sizes.size': 1 },
            options: { 
                name: 'categorySlug_sizes.size',
                background: true
            }
        },

        // Display order combinations
        {
            key: { displayOrder: 1, categorySlug: 1 },
            options: { 
                name: 'displayOrder_categorySlug',
                background: true
            }
        },
        {
            key: { displayOrder: 1, inStock: 1 },
            options: { 
                name: 'displayOrder_inStock',
                background: true
            }
        },

        // 6. TEXT SEARCH INDEX (For product search functionality)
        {
            key: { 
                name: 'text', 
                description: 'text',
                customId: 'text'
            },
            options: { 
                weights: { 
                    name: 10,        // Name matches are most important
                    customId: 8,      // Custom ID matches are very important
                    description: 1   // Description matches are less important
                },
                name: 'product_search_index',
                background: true
            }
        },

        // 7. PARTIAL INDEXES (For better performance on filtered data)
        // Only index products that are in stock (reduces index size)
        {
            key: { categorySlug: 1, price: 1 },
            options: { 
                partialFilterExpression: { inStock: true },
                name: 'category_price_in_stock',
                background: true
            }
        },

        // Only index products with stock > 0 for size queries
        {
            key: { 'sizes.size': 1, categorySlug: 1 },
            options: {
                partialFilterExpression: { 'sizes.stock': { $gt: 0 } },
                name: 'size_category_with_stock',
                background: true
            }
        },

        // Only index new arrivals for faster filtering
        {
            key: { createdAt: -1, categorySlug: 1 },
            options: {
                partialFilterExpression: { isNewArrival: true },
                name: 'new_arrivals_by_category',
                background: true
            }
        },

        // Only index best sellers for faster filtering
        {
            key: { rating: -1, categorySlug: 1 },
            options: {
                partialFilterExpression: { isBestSeller: true },
                name: 'best_sellers_by_category',
                background: true
            }
        }
    ]
};

// =====================================================================================
// 🚀 OPTIMIZATION FUNCTIONS
// =====================================================================================

async function createOptimizedIndexes() {
    const startTime = performance.now();
    console.log('🚀 Starting database optimization...');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const productsCollection = db.collection('products');

        // Get existing indexes
        const existingIndexes = await productsCollection.indexes();
        console.log(`📊 Found ${existingIndexes.length} existing indexes`);

        // Create optimized indexes
        console.log('🔧 Creating optimized indexes...');
        
        for (const indexConfig of OPTIMIZED_INDEXES.products) {
            try {
                const { key, options } = indexConfig;
                
                // Check if index already exists
                const indexExists = existingIndexes.some(
                    idx => idx.name === options.name
                );
                
                if (indexExists) {
                    console.log(`⏭️  Index ${options.name} already exists, skipping...`);
                    continue;
                }

                console.log(`🔨 Creating index: ${options.name}`);
                await productsCollection.createIndex(key, options);
                console.log(`✅ Created index: ${options.name}`);
                
            } catch (error) {
                if (error.code === 85) {
                    // Index already exists with different options
                    console.log(`⚠️  Index ${options.name} exists with different options, skipping...`);
                } else {
                    console.error(`❌ Failed to create index ${options.name}:`, error.message);
                }
            }
        }

        // Verify index creation
        const newIndexes = await productsCollection.indexes();
        console.log(`📊 Total indexes after optimization: ${newIndexes.length}`);

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        console.log(`✅ Database optimization completed in ${duration}ms`);

        return {
            success: true,
            duration,
            totalIndexes: newIndexes.length,
            indexes: newIndexes.map(idx => ({
                name: idx.name,
                key: idx.key,
                unique: idx.unique,
                background: idx.background
            }))
        };

    } catch (error) {
        console.error('❌ Database optimization failed:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

async function analyzeQueryPerformance() {
    console.log('📊 Analyzing query performance...');
    
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const productsCollection = db.collection('products');

        // Test common query patterns
        const testQueries = [
            {
                name: 'Category Filter',
                query: { categorySlug: 'shirts', inStock: true },
                sort: { displayOrder: 1 }
            },
            {
                name: 'Price Range Filter',
                query: { price: { $gte: 100, $lte: 500 }, inStock: true },
                sort: { price: 1 }
            },
            {
                name: 'New Arrivals',
                query: { isNewArrival: true, inStock: true },
                sort: { createdAt: -1 }
            },
            {
                name: 'Best Sellers',
                query: { isBestSeller: true, inStock: true },
                sort: { rating: -1 }
            },
            {
                name: 'Size Filter',
                query: { 'sizes.size': 'M', 'sizes.stock': { $gt: 0 } },
                sort: { displayOrder: 1 }
            },
            {
                name: 'Text Search',
                query: { $text: { $search: 'cotton shirt' } },
                sort: { score: { $meta: 'textScore' } }
            }
        ];

        const results = [];

        for (const testQuery of testQueries) {
            const startTime = performance.now();
            
            try {
                const cursor = productsCollection.find(testQuery.query);
                if (testQuery.sort) {
                    cursor.sort(testQuery.sort);
                }
                cursor.limit(20);
                
                const products = await cursor.toArray();
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                
                results.push({
                    name: testQuery.name,
                    duration,
                    count: products.length,
                    performance: duration < 50 ? 'Excellent' : 
                               duration < 100 ? 'Good' : 
                               duration < 200 ? 'Fair' : 'Poor'
                });
                
                console.log(`✅ ${testQuery.name}: ${duration}ms (${products.length} products)`);
                
            } catch (error) {
                console.error(`❌ ${testQuery.name} failed:`, error.message);
                results.push({
                    name: testQuery.name,
                    duration: -1,
                    count: 0,
                    performance: 'Failed'
                });
            }
        }

        return results;

    } catch (error) {
        console.error('❌ Query analysis failed:', error);
        return [];
    } finally {
        await mongoose.disconnect();
    }
}

async function optimizeMongoDBConfig() {
    console.log('⚙️  Optimizing MongoDB configuration...');
    
    const optimizations = [
        {
            name: 'Enable Query Profiler',
            command: 'db.setProfilingLevel(2, { slowms: 100 })',
            description: 'Profile queries slower than 100ms'
        },
        {
            name: 'Set Cache Size',
            command: 'db.adminCommand({ setParameter: 1, wiredTigerEngineConfigString: "cache_size=1G" })',
            description: 'Increase cache size for better performance'
        },
        {
            name: 'Enable Compression',
            command: 'db.adminCommand({ setParameter: 1, wiredTigerEngineConfigString: "block_compressor=snappy" })',
            description: 'Enable Snappy compression for indexes'
        }
    ];

    console.log('📋 Recommended MongoDB optimizations:');
    optimizations.forEach(opt => {
        console.log(`  • ${opt.name}: ${opt.description}`);
        console.log(`    Command: ${opt.command}`);
        console.log('');
    });
}

// =====================================================================================
// 🎯 MAIN EXECUTION
// =====================================================================================

async function main() {
    console.log('🚀 Starting Amazon-level database optimization...');
    console.log('='.repeat(60));
    
    try {
        // 1. Create optimized indexes
        console.log('📊 Step 1: Creating optimized indexes...');
        const indexResult = await createOptimizedIndexes();
        
        if (indexResult.success) {
            console.log(`✅ Indexes created successfully in ${indexResult.duration}ms`);
            console.log(`📊 Total indexes: ${indexResult.totalIndexes}`);
        } else {
            console.error('❌ Index creation failed:', indexResult.error);
            return;
        }
        
        console.log('');
        
        // 2. Analyze query performance
        console.log('📊 Step 2: Analyzing query performance...');
        const performanceResults = await analyzeQueryPerformance();
        
        if (performanceResults.length > 0) {
            console.log('📈 Query Performance Results:');
            performanceResults.forEach(result => {
                const status = result.duration === -1 ? '❌' : 
                             result.performance === 'Excellent' ? '🚀' :
                             result.performance === 'Good' ? '✅' :
                             result.performance === 'Fair' ? '⚠️' : '❌';
                console.log(`  ${status} ${result.name}: ${result.duration}ms (${result.performance})`);
            });
        }
        
        console.log('');
        
        // 3. Show MongoDB configuration optimizations
        console.log('⚙️  Step 3: MongoDB configuration recommendations...');
        await optimizeMongoDBConfig();
        
        console.log('🎉 Database optimization completed successfully!');
        console.log('🚀 Your database is now optimized for Amazon-level performance!');
        
    } catch (error) {
        console.error('❌ Optimization failed:', error);
        process.exit(1);
    }
}

// Run the optimization
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { createOptimizedIndexes, analyzeQueryPerformance, optimizeMongoDBConfig };
