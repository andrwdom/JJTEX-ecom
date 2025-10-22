#!/usr/bin/env node

/**
 * Test image URL fix
 */

import axios from 'axios';

const API_BASE = 'https://api.jjtextiles.com';

async function testImageFix() {
    console.log('🧪 Testing Image URL Fix...');
    console.log(`📍 URL: ${API_BASE}/api/products/fast`);
    
    try {
        const response = await axios.get(`${API_BASE}/api/products/fast`, {
            timeout: 15000,
            headers: {
                'User-Agent': 'JJTEX-Image-Test/1.0'
            }
        });
        
        console.log(`✅ API Response: ${response.status}`);
        console.log(`📦 Products count: ${response.data.products?.length || 0}`);
        
        // Check first few products for image URLs
        if (response.data.products && response.data.products.length > 0) {
            console.log('\n🔍 Image URL Analysis:');
            
            response.data.products.slice(0, 3).forEach((product, index) => {
                console.log(`\n📦 Product ${index + 1}: ${product.name}`);
                console.log(`   Custom ID: ${product.customId}`);
                console.log(`   Images: ${product.images?.length || 0} images`);
                
                if (product.images && product.images.length > 0) {
                    product.images.forEach((img, imgIndex) => {
                        const isCorrect = img.includes('/uploads/products/');
                        const isWrong = img.includes('/images/products/');
                        
                        console.log(`   Image ${imgIndex + 1}: ${img}`);
                        console.log(`   Status: ${isCorrect ? '✅ Correct' : isWrong ? '❌ Wrong' : '⚠️  Unknown'}`);
                    });
                }
            });
        }
        
    } catch (error) {
        console.error(`❌ Test failed:`, error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
        }
    }
}

// Run test
testImageFix();
