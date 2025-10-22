#!/usr/bin/env node

/**
 * Fix image paths in database - convert /images/products/ to /uploads/products/
 */

import mongoose from 'mongoose';
import productModel from './models/productModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shitha-maternity';

async function fixImagePaths() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products with image path issues
    const products = await productModel.find({
      images: { $regex: /\/images\/products\// }
    });

    console.log(`📦 Found ${products.length} products with incorrect image paths`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        let hasChanges = false;
        const updatedImages = [];

        for (const imageUrl of product.images) {
          let newUrl = imageUrl;

          // Fix /images/products/ to /uploads/products/
          if (imageUrl.includes('/images/products/')) {
            newUrl = imageUrl.replace('/images/products/', '/uploads/products/');
            hasChanges = true;
            console.log(`   🔄 ${imageUrl} → ${newUrl}`);
          }

          updatedImages.push(newUrl);
        }

        if (hasChanges) {
          await productModel.findByIdAndUpdate(product._id, {
            images: updatedImages
          });

          console.log(`✅ Fixed images for product: ${product.name} (${product.customId})`);
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
  }
}

// Run the fix
fixImagePaths();
