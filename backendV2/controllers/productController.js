import fs from "fs";
import path from "path";
import imageOptimizer from '../utils/imageOptimizer.js';
import productModel from '../models/productModel.js';
import Category from '../models/Category.js';
import redisService from '../services/redisService.js';


// GET /api/products/:id or /api/products/custom/:customId - RESTful single product fetch
export const getProductById = async (req, res) => {
    try {
        console.log('🔧 DEBUG: getProductById called with ID:', req.params.id);
        console.log('🔧 DEBUG: Query params:', req.query);
        
        let product;
        if (req.params.id && req.params.id.length === 24) {
            product = await productModel.findById(req.params.id).lean();
            console.log('🔧 DEBUG: Found by MongoDB ID:', product ? 'Yes' : 'No');
        }
        if (!product && req.params.id) {
            // Try fetching by customId
            product = await productModel.findOne({ customId: req.params.id }).lean();
            console.log('🔧 DEBUG: Found by customId:', product ? 'Yes' : 'No');
        }
        if (!product) {
            console.log('🔧 DEBUG: Product not found');
            return res.status(404).json({ error: 'Product not found' });
        }
        
        console.log('🔧 DEBUG: Product found - sizes before processing:', JSON.stringify(product.sizes, null, 2));
        console.log('🔧 DEBUG: Product name:', product.name);
        console.log('🔧 DEBUG: Product customId:', product.customId);
        
        // 🔑 CRITICAL FIX: Calculate available stock (stock - reserved) for each size
        if (product.sizes && Array.isArray(product.sizes)) {
            product.sizes = product.sizes.map(sizeObj => ({
                ...sizeObj,
                availableStock: Math.max(0, (sizeObj.stock || 0) - (sizeObj.reserved || 0)),
                // Keep original values for reference
                originalStock: sizeObj.stock || 0,
                reserved: sizeObj.reserved || 0
            }));
        }
        
        console.log('🔧 DEBUG: Product sizes after processing:', JSON.stringify(product.sizes, null, 2));
        console.log('🔧 DEBUG: Total sizes count:', product.sizes ? product.sizes.length : 0);
        
        // 🔧 JJTEX COMPATIBILITY: Add 'image' field for frontend compatibility
        if (product.images && !product.image) {
            product.image = product.images; // Frontend expects 'image' array
        }
        
        // Add cache busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.status(200).json({ product });
    } catch (error) {
        console.error('Get Product By ID Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/products/category/:category or /api/products?category=...
export const getAllProducts = async (req, res) => {
    try {
        const category = req.params.category || req.query.category;
        console.log('GET /api/products category query:', category);
        const {
            page = 1,
            limit = 1000,
            search,
            isNewArrival,
            isBestSeller,
            sortBy = 'createdAt',
            minPrice,
            maxPrice,
            categorySlug,
            size,
            sleeveType
        } = req.query;

        // 🔧 CACHE KEY: Create unique cache key based on query parameters
        const cacheKey = `products:${JSON.stringify({
            category: category || 'all',
            categorySlug: categorySlug || 'all',
            page: parseInt(page),
            limit: parseInt(limit),
            search: search || '',
            isNewArrival: isNewArrival || false,
            isBestSeller: isBestSeller || false,
            sortBy,
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            size: size || '',
            sleeveType: sleeveType || ''
        })}`;

        // Try to get from cache first
        const cachedResult = await redisService.get(cacheKey);
        if (cachedResult) {
            console.log('📦 Cache HIT: Products found in Redis');
            res.set({
                'Cache-Control': 'public, max-age=300', // 5 minutes
                'X-Cache-Status': 'HIT'
            });
            return res.status(200).json(cachedResult);
        }

        console.log('📭 Cache MISS: Fetching products from database');
        const filter = {};
        if (category) {
            console.log('Filtering by category:', category);
            filter.categorySlug = category.toLowerCase();
        }
        if (categorySlug) {
            console.log('Filtering by categorySlug:', categorySlug);
            filter.categorySlug = categorySlug;
        }
        if (isNewArrival) filter.isNewArrival = isNewArrival === 'true';
        if (isBestSeller) filter.isBestSeller = isBestSeller === 'true';
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Size filtering - check if the size exists in availableSizes array AND has stock
        if (size) {
            console.log('Filtering by size:', size);
            // Filter products that have the selected size AND have stock for that size
            filter['sizes'] = {
                $elemMatch: {
                    'size': size,
                    'stock': { $gt: 0 }
                }
            };
        }
        
        // Sleeve type filtering
        if (sleeveType) {
            filter.sleeveType = sleeveType;
        }
        
        // Debug logging removed for production performance
        
        // --- Sorting logic update for displayOrder ---
        const sortField = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortField]: sortOrder };
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // 🔧 PRODUCTION OPTIMIZATION: Use parallel queries for better performance
        // For initial load, prioritize speed over exact count
        const [total, products] = await Promise.all([
            productModel.countDocuments(filter),
            productModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('_id customId name price description images category categorySlug subCategory type sleeveType sizes availableSizes features rating reviews isNewArrival isBestSeller inStock bestseller createdAt updatedAt displayOrder')
                .lean()
        ]);
            
        // Always include customId and calculate available stock in the response
        const productsWithCustomId = products.map(p => {
            const product = { ...p, customId: p.customId };
            
            // 🔧 JJTEX COMPATIBILITY: Fix image URLs and add 'image' field for frontend compatibility
            if (product.images && Array.isArray(product.images)) {
                product.images = product.images.map(img => {
                    // Fix image URLs to use correct path
                    if (img && img.includes('/images/products/')) {
                        // Convert /images/products/ to /uploads/products/
                        return img.replace('/images/products/', '/uploads/products/');
                    } else if (img && !img.startsWith('http')) {
                        return img.startsWith('/uploads/') ? img : `/uploads/${img}`;
                    }
                    return img;
                });
                product.image = product.images; // Frontend expects 'image' array
            }
            
            // 🔑 CRITICAL FIX: Calculate available stock (stock - reserved) for each size
            if (product.sizes && Array.isArray(product.sizes)) {
                product.sizes = product.sizes.map(sizeObj => ({
                    ...sizeObj,
                    availableStock: Math.max(0, (sizeObj.stock || 0) - (sizeObj.reserved || 0)),
                    // Keep original values for reference
                    originalStock: sizeObj.stock || 0,
                    reserved: sizeObj.reserved || 0
                }));
            }
            
            return product;
        });
        
        // Debug logging removed for production performance
        
        // 🔧 JJTEX COMPATIBILITY: Return format that matches frontend expectations
        const result = { 
            success: true,
            products: productsWithCustomId,
            data: productsWithCustomId, // Frontend compatibility
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            limit: limitNum
        };

        // Cache the result for 5 minutes (300 seconds)
        await redisService.set(cacheKey, result, 300);
        
        res.set({
            'Cache-Control': 'public, max-age=300', // 5 minutes
            'X-Cache-Status': 'MISS'
        });
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Get All Products Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// List all products with filtering, sorting, and pagination
export const listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 24;
        const skip = (page - 1) * limit;

        const {
            search,
            categorySlug,
            size,
            minPrice,
            maxPrice,
            sortBy = 'displayOrder',
            sortOrder = 'asc'
        } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { customId: { $regex: search, $options: 'i' } }
            ];
        }

        if (categorySlug) {
            const category = await Category.findOne({ slug: categorySlug });
            if (category) {
                query.category = category.name;
            }
        }

        if (size) {
            query['sizes.size'] = size;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) {
                query.price.$gte = parseInt(minPrice);
            }
            if (maxPrice) {
                query.price.$lte = parseInt(maxPrice);
            }
        }
        
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const products = await productModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await productModel.countDocuments(query);
        const pages = Math.ceil(total / limit);

        // 🔧 JJTEX COMPATIBILITY: Fix image URLs and add 'image' field for frontend compatibility
        const productsWithCompatibility = products.map(p => {
            const product = { ...p };
            if (product.images && Array.isArray(product.images)) {
                product.images = product.images.map(img => {
                    // Fix image URLs to use correct path
                    if (img && img.includes('/images/products/')) {
                        // Convert /images/products/ to /uploads/products/
                        return img.replace('/images/products/', '/uploads/products/');
                    } else if (img && !img.startsWith('http')) {
                        return img.startsWith('/uploads/') ? img : `/uploads/${img}`;
                    }
                    return img;
                });
                product.image = product.images; // Frontend expects 'image' array
            }
            return product;
        });

        res.json({ success: true, products: productsWithCompatibility, total, pages });
    } catch (error) {
        console.error("Error in listProducts:", error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
};

// function for removing product

export const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findOne({ _id: productId });
        if (product) {
            res.status(200).json({ success: true, product });
        } else {
            res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (error) {
        console.error('Single product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const reorderProducts = async (req, res) => {
  try {
    let { products, categorySlug } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Products array is required and must not be empty' 
      });
    }

    console.log('🔄 Reordering products:', products.length, 'items');
    console.log('📂 Category slug:', categorySlug);

    // Update display order for each product
    const updatePromises = products.map(async (product) => {
      const updateData = { displayOrder: product.displayOrder };
      
      // If categorySlug is provided, also update the category
      if (categorySlug && categorySlug !== 'all') {
        const category = await Category.findOne({ slug: categorySlug });
        if (category) {
          updateData.category = category.name;
          updateData.categorySlug = categorySlug;
        }
      }
      
      return productModel.findByIdAndUpdate(
        product._id,
        updateData,
        { new: true }
      );
    });

    const updatedProducts = await Promise.all(updatePromises);
    
    console.log('✅ Successfully reordered', updatedProducts.length, 'products');
    
    res.json({ 
      success: true, 
      message: 'Products reordered successfully',
      products: updatedProducts 
    });
  } catch (error) {
    console.error('❌ Reorder products error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to reorder products' 
    });
  }
};

// Fast initial load endpoint for frontend
export const getProductsFast = async (req, res) => {
    try {
        console.log('🚀 Fast products load requested');
        const startTime = Date.now();
        
        // Minimal query for fastest response
        const products = await productModel.find({ inStock: true })
            .select('_id customId name price images category categorySlug subCategory type sizes isNewArrival isBestSeller bestseller displayOrder')
            .sort({ displayOrder: 1, createdAt: -1 })
            .limit(50) // Limit for faster response
            .lean();
        
        // Quick processing with proper image URLs
        const processedProducts = products.map(p => ({
            ...p,
            customId: p.customId,
            image: p.images?.map(img => {
                // Fix image URLs to use correct path
                if (img && img.includes('/images/products/')) {
                    // Convert /images/products/ to /uploads/products/
                    return img.replace('/images/products/', '/uploads/products/');
                } else if (img && !img.startsWith('http')) {
                    return img.startsWith('/uploads/') ? img : `/uploads/${img}`;
                }
                return img;
            }) || [], // Frontend compatibility
            images: p.images?.map(img => {
                // Fix image URLs to use correct path
                if (img && img.includes('/images/products/')) {
                    // Convert /images/products/ to /uploads/products/
                    return img.replace('/images/products/', '/uploads/products/');
                } else if (img && !img.startsWith('http')) {
                    return img.startsWith('/uploads/') ? img : `/uploads/${img}`;
                }
                return img;
            }) || [],
            sizes: p.sizes?.map(sizeObj => ({
                ...sizeObj,
                availableStock: Math.max(0, (sizeObj.stock || 0) - (sizeObj.reserved || 0))
            })) || []
        }));
        
        const responseTime = Date.now() - startTime;
        console.log(`⚡ Fast products loaded in ${responseTime}ms`);
        
        res.set({
            'Cache-Control': 'public, max-age=300',
            'X-Response-Time': `${responseTime}ms`
        });
        
        res.json({
            success: true,
            products: processedProducts,
            data: processedProducts,
            total: processedProducts.length,
            fastLoad: true,
            responseTime: `${responseTime}ms`
        });
        
    } catch (error) {
        console.error('Fast products load error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Health check endpoint for products API
export const healthCheck = async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Quick database ping
        const dbStart = Date.now();
        await productModel.findOne().lean();
        const dbTime = Date.now() - dbStart;
        
        // Redis ping
        const redisStart = Date.now();
        const redisAvailable = redisService.isAvailable();
        const redisTime = Date.now() - redisStart;
        
        const totalTime = Date.now() - startTime;
        
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            performance: {
                totalTime: `${totalTime}ms`,
                databaseTime: `${dbTime}ms`,
                redisTime: `${redisTime}ms`,
                redisAvailable
            },
            version: '2.0.0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

export const moveProduct = async (req, res) => {
  try {
    const { productId, action, categorySlug } = req.body;
    
    if (!productId || !action || !categorySlug) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, action, and category slug are required'
      });
    }

    // Find the product
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get all products in the same category
    const category = await Category.findOne({ slug: categorySlug });
    const categoryProducts = await productModel.find({ categorySlug })
      .sort({ displayOrder: 1 });

    if (categoryProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products found in this category'
      });
    }

    // Update display order
    if (action === 'top') {
      // Move to top (lowest display order)
      const minOrder = Math.min(...categoryProducts.map(p => p.displayOrder || 0));
      await productModel.findByIdAndUpdate(productId, { 
        displayOrder: minOrder - 1,
        category: category?.name || product.category,
        categorySlug 
      });
    } else if (action === 'bottom') {
      // Move to bottom (highest display order)
      const maxOrder = Math.max(...categoryProducts.map(p => p.displayOrder || 0));
      await productModel.findByIdAndUpdate(productId, { 
        displayOrder: maxOrder + 1,
        category: category?.name || product.category,
        categorySlug 
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "top" or "bottom"'
      });
    }

    res.json({
      success: true,
      message: `Product moved to ${action} successfully`
    });
  } catch (error) {
    console.error('Move product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================================================
// ADD PRODUCT - Handle product creation with image uploads
// =====================================================================================

/**
 * POST /api/products - Add new product with image uploads
 * Handles FormData with multiple images and saves to VPS upload folder
 */
export const addProduct = async (req, res) => {
  try {
    console.log('🔧 DEBUG: addProduct called');
    console.log('🔧 DEBUG: Request body:', req.body);
    console.log('🔧 DEBUG: Request files:', req.files);
    
    // Extract form data
    const {
      customId,
      name,
      description,
      price,
      category,
      categorySlug,
      subCategory,
      type,
      bestseller,
      sizes,
      availableSizes,
      sleeveType
    } = req.body;
    
    // Validate required fields
    if (!customId || !name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customId, name, description, price, category'
      });
    }
    
    // Check if product with same customId already exists
    const existingProduct = await productModel.findOne({ customId });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this ID already exists'
      });
    }
    
    // Process uploaded images
    const images = [];
    const uploadDir = process.env.UPLOAD_DIR || '/var/www/jjtex-ecom/uploads';
    const productUploadDir = path.join(uploadDir, 'products');
    
    // Ensure upload directory exists
    if (!fs.existsSync(productUploadDir)) {
      fs.mkdirSync(productUploadDir, { recursive: true });
    }
    
    // Process each uploaded image
    const imageFields = ['image1', 'image2', 'image3', 'image4'];
    for (const field of imageFields) {
      if (req.files && req.files[field] && req.files[field][0]) {
        const file = req.files[field][0];
        console.log(`🔧 DEBUG: Processing ${field}:`, file.originalname);
        console.log(`🔧 DEBUG: File object:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          bufferExists: !!file.buffer,
          bufferLength: file.buffer ? file.buffer.length : 0
        });
        
        // Check if buffer exists
        if (!file.buffer) {
          console.error(`❌ ERROR: No buffer found for ${field}`);
          continue;
        }
        
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `${customId}_${field}_${Date.now()}${fileExtension}`;
        const filePath = path.join(productUploadDir, fileName);
        
        try {
          // Save file to VPS upload folder
          fs.writeFileSync(filePath, file.buffer);
          console.log(`🔧 DEBUG: Saved ${field} to:`, filePath);
          
          // Generate URL for the saved image
          const baseUrl = process.env.BASE_URL || 'https://api.jjtextiles.com';
          const imageUrl = `${baseUrl}/uploads/products/${fileName}`;
          images.push(imageUrl);
        } catch (writeError) {
          console.error(`❌ ERROR: Failed to write file ${field}:`, writeError);
          continue;
        }
      }
    }
    
    // Parse sizes and availableSizes
    let parsedSizes = [];
    let parsedAvailableSizes = [];
    
    try {
      parsedSizes = JSON.parse(sizes || '[]');
      parsedAvailableSizes = JSON.parse(availableSizes || '[]');
    } catch (error) {
      console.error('Error parsing sizes:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid sizes format'
      });
    }
    
    // Create new product
    const newProduct = new productModel({
      customId,
      name,
      description,
      price: Number(price),
      category,
      categorySlug: categorySlug || category.toLowerCase().replace(/\s+/g, '-'),
      subCategory: subCategory || '',
      type: type || '',
      bestseller: bestseller === 'true',
      sizes: parsedSizes,
      availableSizes: parsedAvailableSizes,
      images,
      sleeveType: sleeveType || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save to database
    const savedProduct = await newProduct.save();
    console.log('🔧 DEBUG: Product saved successfully:', savedProduct.customId);
    
    // Invalidate products cache when product is added
    await redisService.delPattern('products:*');
    console.log('🗑️ Cache invalidated: All products cache cleared');
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: savedProduct
    });
    
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add product'
    });
  }
};

// =====================================================================================
// UPDATE PRODUCT - Handle product updates with image uploads
// =====================================================================================

/**
 * PUT /api/products/:id - Update existing product with image uploads
 * Handles FormData with multiple images and saves to VPS upload folder
 */
export const updateProductV2 = async (req, res) => {
  try {
    console.log('🔧 DEBUG: updateProduct called for ID:', req.params.id);
    console.log('🔧 DEBUG: Request body:', req.body);
    console.log('🔧 DEBUG: Request files:', req.files);
    
    const productId = req.params.id;
    
    // Find existing product
    let product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Extract form data
    const {
      name,
      description,
      price,
      category,
      categorySlug,
      subCategory,
      type,
      bestseller,
      sizes,
      availableSizes,
      sleeveType
    } = req.body;
    
    // Update product fields
    const updateData = {
      name: name || product.name,
      description: description || product.description,
      price: price ? Number(price) : product.price,
      category: category || product.category,
      categorySlug: categorySlug || product.categorySlug,
      subCategory: subCategory || product.subCategory,
      type: type || product.type,
      bestseller: bestseller !== undefined ? bestseller === 'true' : product.bestseller,
      sleeveType: sleeveType || product.sleeveType,
      updatedAt: new Date()
    };
    
    // Process new images if provided
    if (req.files && Object.keys(req.files).length > 0) {
      const newImages = [];
      const uploadDir = process.env.UPLOAD_DIR || '/var/www/jjtex-ecom/uploads';
      const productUploadDir = path.join(uploadDir, 'products');
      
      if (!fs.existsSync(productUploadDir)) {
        fs.mkdirSync(productUploadDir, { recursive: true });
      }
      
      const imageFields = ['image1', 'image2', 'image3', 'image4'];
      for (const field of imageFields) {
        if (req.files[field] && req.files[field][0]) {
          const file = req.files[field][0];
          console.log(`🔧 DEBUG: Processing ${field} in updateProductV2:`, file.originalname);
          console.log(`🔧 DEBUG: File object:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            bufferExists: !!file.buffer,
            bufferLength: file.buffer ? file.buffer.length : 0
          });
          
          // Check if buffer exists
          if (!file.buffer) {
            console.error(`❌ ERROR: No buffer found for ${field} in updateProductV2`);
            continue;
          }
          
          const fileExtension = path.extname(file.originalname);
          const fileName = `${product.customId}_${field}_${Date.now()}${fileExtension}`;
          const filePath = path.join(productUploadDir, fileName);
          
          try {
            fs.writeFileSync(filePath, file.buffer);
            console.log(`🔧 DEBUG: Saved ${field} to:`, filePath);
            const baseUrl = process.env.BASE_URL || 'https://api.jjtextiles.com';
            const imageUrl = `${baseUrl}/uploads/products/${fileName}`;
            newImages.push(imageUrl);
          } catch (writeError) {
            console.error(`❌ ERROR: Failed to write file ${field} in updateProductV2:`, writeError);
            continue;
          }
        }
      }
      
      // Combine existing images with new ones
      updateData.images = [...(product.images || []), ...newImages];
    }
    
    // Parse sizes if provided
    if (sizes) {
      try {
        updateData.sizes = JSON.parse(sizes);
      } catch (error) {
        console.error('Error parsing sizes:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid sizes format'
        });
      }
    }
    
    if (availableSizes) {
      try {
        updateData.availableSizes = JSON.parse(availableSizes);
      } catch (error) {
        console.error('Error parsing availableSizes:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid availableSizes format'
        });
      }
    }
    
    // Update product in database
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('🔧 DEBUG: Product updated successfully:', updatedProduct.customId);
    
    // Invalidate products cache when product is updated
    await redisService.delPattern('products:*');
    console.log('🗑️ Cache invalidated: All products cache cleared');
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product'
    });
  }
};

// =====================================================================================
// REMOVE PRODUCT - Handle product deletion
// =====================================================================================

/**
 * DELETE /api/products/:id - Delete product by ID
 */
export const removeProductV2 = async (req, res) => {
  try {
    console.log('🔧 DEBUG: removeProduct called for ID:', req.params.id);
    
    const productId = req.params.id;
    
    // Find and delete product
    const product = await productModel.findByIdAndDelete(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log('🔧 DEBUG: Product deleted successfully:', product.customId);
    
    // Invalidate products cache when product is deleted
    await redisService.delPattern('products:*');
    console.log('🗑️ Cache invalidated: All products cache cleared');
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Remove product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product'
    });
  }
};
