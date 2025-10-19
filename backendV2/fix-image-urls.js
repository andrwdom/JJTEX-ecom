#!/usr/bin/env node

/**
 * Fix Product Image URLs Script
 * 
 * This script fixes product image URLs that might be using incorrect BASE_URL
 * and updates them to use the correct API URL format.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import the product model
import productModel from './models/productModel.js';

const MONGODB_URI = process.env.MONGODB_URI;
const BASE_URL = process.env.BASE_URL || 'https://api.jjtextiles.com';

if (!MONGODB_URI) {
  console.error('❌ MONGOD not found in environment variables');
  process.exit(1);
}

async function fixImageUrls() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Finding products with incorrect image URLs...');
    
    // Find products that have images with incorrect URLs
    const products = await productModel.find({
      images: { $exists: true, $ne: [] }
    });

    console.log(`📦 Found ${products.length} products with images`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        let hasChanges = false;
        const updatedImages = [];

        for (const imageUrl of product.images) {
          let newUrl = imageUrl;

          // Fix common URL patterns
          if (imageUrl.includes('https://jjtextiles.com/uploads/')) {
            newUrl = imageUrl.replace('https://jjtextiles.com/uploads/', `${BASE_URL}/uploads/`);
            hasChanges = true;
          } else if (imageUrl.includes('http://localhost:4000/uploads/')) {
            newUrl = imageUrl.replace('http://localhost:4000/uploads/', `${BASE_URL}/uploads/`);
            hasChanges = true;
          } else if (imageUrl.includes('https://shithaa.in/uploads/')) {
            newUrl = imageUrl.replace('https://shithaa.in/uploads/', `${BASE_URL}/uploads/`);
            hasChanges = true;
          }

          updatedImages.push(newUrl);
        }

        if (hasChanges) {
          await productModel.findByIdAndUpdate(product._id, {
            images: updatedImages
          });

          console.log(`✅ Fixed images for product: ${product.name} (${product.customId})`);
          console.log(`   Old: ${product.images.join(', ')}`);
          console.log(`   New: ${updatedImages.join(', ')}`);
          fixedCount++;
        } else {
          console.log(`ℹ️  No changes needed for product: ${product.name} (${product.customId})`);
        }

      } catch (error) {
        console.error(`❌ Error fixing product ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total products processed: ${products.length}`);
    console.log(`   Products fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fixImageUrls();
