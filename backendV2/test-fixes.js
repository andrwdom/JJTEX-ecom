#!/usr/bin/env node

/**
 * Test Fixes Script
 * 
 * This script tests if the CORS and image URL fixes are working correctly.
 */

import axios from 'axios';

const API_BASE = 'https://api.jjtextiles.com';

async function testFixes() {
  console.log('🧪 Testing CORS and API fixes...\n');

  // Test 1: Carousel API
  try {
    console.log('1️⃣ Testing Carousel API...');
    const carouselResponse = await axios.get(`${API_BASE}/api/carousel`, {
      headers: {
        'Origin': 'https://www.jjtextiles.com'
      }
    });
    
    if (carouselResponse.data.success) {
      console.log('✅ Carousel API working - CORS fixed!');
      console.log(`   Found ${carouselResponse.data.data.length} carousel items`);
    } else {
      console.log('❌ Carousel API returned error');
    }
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('❌ CORS still blocked - check server configuration');
    } else {
      console.log('❌ Carousel API error:', error.message);
    }
  }

  // Test 2: Products API
  try {
    console.log('\n2️⃣ Testing Products API...');
    const productsResponse = await axios.get(`${API_BASE}/api/products?limit=5`, {
      headers: {
        'Origin': 'https://www.jjtextiles.com'
      }
    });
    
    if (productsResponse.data.success) {
      console.log('✅ Products API working!');
      console.log(`   Found ${productsResponse.data.products.length} products`);
      
      // Check image URLs
      const products = productsResponse.data.products;
      if (products.length > 0) {
        const firstProduct = products[0];
        if (firstProduct.images && firstProduct.images.length > 0) {
          console.log(`   First product image: ${firstProduct.images[0]}`);
          
          // Test if image URL is accessible
          try {
            const imageResponse = await axios.head(firstProduct.images[0]);
            if (imageResponse.status === 200) {
              console.log('✅ Product images are accessible!');
            } else {
              console.log('❌ Product images not accessible');
            }
          } catch (imageError) {
            console.log('❌ Product images not accessible:', imageError.message);
          }
        } else {
          console.log('ℹ️  No images found for first product');
        }
      }
    } else {
      console.log('❌ Products API returned error');
    }
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('❌ CORS still blocked for products API');
    } else {
      console.log('❌ Products API error:', error.message);
    }
  }

  // Test 3: Categories API
  try {
    console.log('\n3️⃣ Testing Categories API...');
    const categoriesResponse = await axios.get(`${API_BASE}/api/categories`, {
      headers: {
        'Origin': 'https://www.jjtextiles.com'
      }
    });
    
    if (categoriesResponse.data.success) {
      console.log('✅ Categories API working!');
      console.log(`   Found ${categoriesResponse.data.data.length} categories`);
    } else {
      console.log('❌ Categories API returned error');
    }
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('❌ CORS still blocked for categories API');
    } else {
      console.log('❌ Categories API error:', error.message);
    }
  }

  console.log('\n🏁 Test completed!');
}

testFixes().catch(console.error);
