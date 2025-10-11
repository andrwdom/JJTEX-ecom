import fs from "fs";
import path from "path";
import imageOptimizer from '../utils/imageOptimizer.js';
import productModel from '../models/productModel.js';
import Category from '../models/Category.js';


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
        const [total, products] = await Promise.all([
            productModel.countDocuments(filter),
            productModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean()
        ]);
            
        // Always include customId and calculate available stock in the response
        const productsWithCustomId = products.map(p => {
            const product = { ...p, customId: p.customId };
            
            // 🔧 JJTEX COMPATIBILITY: Add 'image' field for frontend compatibility
            if (product.images && !product.image) {
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
        
        res.status(200).json({ 
            products: productsWithCustomId,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            limit: limitNum
        });
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

        // 🔧 JJTEX COMPATIBILITY: Add 'image' field for frontend compatibility
        const productsWithCompatibility = products.map(p => {
            const product = { ...p };
            if (product.images && !product.image) {
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

// Add product
export const addProduct = async (req, res) => {
    try {
        console.log('Add Product Request Body:', req.body);
        console.log('Add Product Files:', req.files);
        console.log('Raw sizes value:', req.body.sizes);
        console.log('Raw availableSizes value:', req.body.availableSizes);

        const { customId, name, description, price, category, subCategory, type, sizes, bestseller, originalPrice, categorySlug, features, isNewArrival, isBestSeller, availableSizes, stock, sleeveType } = req.body

        // Validate required fields
        if (!customId) {
            return res.status(400).json({ success: false, message: "Custom product ID is required" });
        }
        if (!name || !description || !price || !category) {
            console.log('Missing fields:', {
                customId: !customId,
                name: !name,
                description: !description,
                price: !price,
                category: !category
            });
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields",
                missing: {
                    customId: !customId,
                    name: !name,
                    description: !description,
                    price: !price,
                    category: !category
                }
            });
        }

        // Validate price is a number
        if (isNaN(Number(price)) || Number(price) <= 0) {
            console.log('Invalid price:', price);
            return res.status(400).json({
                success: false,
                message: "Price must be a positive number"
            });
        }

        // Validate sizes
        let parsedSizes;
        try {
            console.log('Raw sizes:', sizes);
            parsedSizes = JSON.parse(sizes);
            if (!Array.isArray(parsedSizes)) {
                console.log('Sizes is not an array:', parsedSizes);
                throw new Error('Sizes must be an array');
            }
            if (parsedSizes.length === 0) {
                console.log('Sizes array is empty');
                return res.status(400).json({
                    success: false,
                    message: "At least one size must be selected"
                });
            }
            
            // Validate that at least one size has stock > 0
            const sizesWithStock = parsedSizes.filter(s => s.stock > 0);
            if (sizesWithStock.length === 0) {
                console.log('No sizes with stock > 0 found');
                return res.status(400).json({
                    success: false,
                    message: "At least one size must have stock greater than 0"
                });
            }
            
            console.log('Parsed sizes:', parsedSizes);
        } catch (error) {
            console.error('Sizes parsing error:', error);
            return res.status(400).json({
                success: false,
                message: "Invalid sizes format",
                error: error.message
            });
        }

        // Parse availableSizes if provided
        let parsedAvailableSizes = [];
        if (availableSizes) {
            try {
                parsedAvailableSizes = JSON.parse(availableSizes);
                if (!Array.isArray(parsedAvailableSizes)) {
                    throw new Error('availableSizes must be an array');
                }
            } catch (error) {
                console.error('availableSizes parsing error:', error);
                return res.status(400).json({
                    success: false,
                    message: "Invalid availableSizes format",
                    error: error.message
                });
            }
        }

        const image1 = req.files?.image1?.[0]
        const image2 = req.files?.image2?.[0]
        const image3 = req.files?.image3?.[0]
        const image4 = req.files?.image4?.[0]

        console.log('Image files:', { image1, image2, image3, image4 });

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        if (images.length === 0) {
            console.log('No images provided');
            return res.status(400).json({ 
                success: false, 
                message: "At least one image is required" 
            });
        }

        // Save and optimize images
        console.log('🔄 Starting image processing...');
        // 🔧 JJTEX: Local storage directory on VPS (matches imageOptimizer expectations)
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
        
        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // First, save the uploaded files to disk
        const savedFiles = [];
        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            const fileExtension = path.extname(file.originalname);
            const fileName = `${customId}_image${i + 1}_${Date.now()}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            
            // Save file to disk
            fs.writeFileSync(filePath, file.buffer);
            savedFiles.push(filePath);
            console.log(`💾 Saved image ${i + 1} to: ${filePath}`);
        }
        
        let optimizationResult;
        let optimizedFiles;
        let results;
        let stats;
        
        try {
            // Now optimize the saved files
            optimizationResult = await imageOptimizer.optimizeMultipleImages(savedFiles, uploadDir);
            optimizedFiles = optimizationResult.optimizedFiles;
            results = optimizationResult.results;
            stats = imageOptimizer.getOptimizationStats(results);
        } catch (error) {
            console.error('❌ Image optimization failed:', error);
            // Use fallback - keep original files
            optimizedFiles = savedFiles.map(filePath => ({
                filename: path.basename(filePath),
                originalname: path.basename(filePath)
            }));
            results = savedFiles.map(filePath => ({
                originalName: path.basename(filePath),
                optimizedName: path.basename(filePath),
                originalSize: '0 Bytes',
                optimizedSize: '0 Bytes',
                compressionRatio: 0,
                processingTime: 0,
                success: true,
                error: null
            }));
            stats = {
                totalFiles: savedFiles.length,
                successful: savedFiles.length,
                failed: 0,
                avgCompressionRatio: 0,
                totalProcessingTime: 0
            };
        }

        console.log('📊 FAST Image Optimization Summary:');
        console.log(`   Total files: ${stats.totalFiles}`);
        console.log(`   Successful: ${stats.successful}`);
        console.log(`   Failed: ${stats.failed}`);
        console.log(`   Average compression: ${stats.avgCompressionRatio}%`);
        console.log(`   Total processing time: ${stats.totalProcessingTime}ms`);

        // Build simple image URLs for VPS using optimized filenames
        // 🔧 JJTEX: Update base URL for JJTEX site
        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
        let imagesUrl;
        
        try {
            imagesUrl = optimizedFiles.map(img => {
                const baseFilename = path.parse(img.filename).name;
                return imageOptimizer.generateResponsiveUrls(baseFilename, baseUrl);
            });
        } catch (error) {
            console.error('❌ Error generating image URLs:', error);
            // Fallback to simple URLs
            // 🔧 JJTEX: Serve from /uploads/ endpoint (matches new upload path)
            imagesUrl = optimizedFiles.map(img => {
                return `${baseUrl}/uploads/${img.filename}`;
            });
        }

        console.log('📊 Image URLs generated:', imagesUrl);

        // Parse features if provided
        let parsedFeatures = [];
        if (features) {
            try {
                parsedFeatures = JSON.parse(features);
                if (!Array.isArray(parsedFeatures)) {
                    throw new Error('Features must be an array');
                }
            } catch (error) {
                console.error('Features parsing error:', error);
                return res.status(400).json({
                    success: false,
                    message: "Invalid features format",
                    error: error.message
                });
            }
        }

        // Ensure both bestseller and isBestSeller are set for compatibility
        const bestsellerValue = (bestseller === "true" || isBestSeller === "true") ? true : false;

        // Validate sleeveType if provided - only for categories that require it
        const validSleeveTypes = ["Puff Sleeve", "Normal Sleeve"];
        const categoriesRequiringSleeveType = [
            "Zipless Feeding Lounge Wear",
            "Non-Feeding Lounge Wear", 
            "Zipless Feeding Dupatta Lounge Wear"
        ];
        
        // Only validate sleeveType if the category requires it
        if (categoriesRequiringSleeveType.includes(category)) {
            if (sleeveType && !validSleeveTypes.includes(sleeveType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid sleeve type. Must be 'Puff Sleeve' or 'Normal Sleeve'"
                });
            }
        } else {
            // For categories that don't require sleeveType, don't include it in product data
            console.log(`Category "${category}" does not require sleeveType`);
        }

        const productData = {
            customId,
            name,
            description,
            category,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            subCategory: subCategory || "",
            type: type || "",
            categorySlug: categorySlug || "",
            bestseller: bestsellerValue,
            isBestSeller: bestsellerValue,
            isNewArrival: isNewArrival === "true" ? true : false,
            sizes: parsedSizes,
            availableSizes: parsedAvailableSizes,
            features: parsedFeatures,
            images: imagesUrl,
            date: Date.now(),
            stock: stock !== undefined ? Number(stock) : 0,
            // Only include sleeveType if category requires it
            ...(categoriesRequiringSleeveType.includes(category) ? { sleeveType: sleeveType || null } : {})
        }

        // After parsing sizes, always sync main stock field
        const totalStock = Array.isArray(parsedSizes) ? parsedSizes.reduce((sum, s) => sum + (s.stock || 0), 0) : 0;
        productData.stock = totalStock;

        console.log('Creating product with data:', productData);

        const product = new productModel(productData);
        await product.save();

        console.log('Product saved successfully:', product._id);

        // Return response with optimization stats
        res.status(201).json({ 
            product,
            imageOptimization: {
                stats,
                details: results.map(result => ({
                    originalName: result.originalName,
                    optimizedName: result.optimizedName,
                    originalSize: imageOptimizer.formatFileSize(result.originalSize),
                    optimizedSize: imageOptimizer.formatFileSize(result.optimizedSize),
                    compressionRatio: result.compressionRatio,
                    processingTime: result.processingTime
                }))
            }
        });
    } catch (error) {
        console.error('Add Product Error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to add product';
        let statusCode = 500;
        
        if (error.name === 'ValidationError') {
            errorMessage = 'Product validation failed: ' + error.message;
            statusCode = 400;
        } else if (error.code === 11000) {
            errorMessage = 'Product ID already exists. Please use a unique ID.';
            statusCode = 400;
        } else if (error.message.includes('ENOENT')) {
            errorMessage = 'File system error. Please check server configuration.';
            statusCode = 500;
        } else if (error.message.includes('permission')) {
            errorMessage = 'Permission denied. Please check file permissions.';
            statusCode = 500;
        }
        
        res.status(statusCode).json({ 
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// function for removing product
export const removeProduct = async (req, res) => {
    console.log('req.method:', req.method, 'req.originalUrl:', req.originalUrl, 'req.params:', req.params);
    console.log('DELETE params:', req.params, 'body:', req.body, 'query:', req.query);
    try {
        const id = req.params.id;
        if (!id) {
            return res.json({ success: false, message: "Product ID is required" });
        }
        const product = await productModel.findById(id);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }
        // Delete associated image files from local storage
        if (Array.isArray(product.images)) {
            for (const imageUrl of product.images) {
                // Only handle local VPS URLs
                const match = imageUrl.match(/\/images\/products\/(.+)$/);
                if (match && match[1]) {
                    const filename = match[1];
                    const filePath = `/var/www/shithaa-ecom/uploads/products/${filename}`;
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        console.error(`Failed to delete image file: ${filePath}`, err);
                    }
                }
            }
        }
        await productModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Product Removed Successfully" })
    } catch (error) {
        console.error('Remove Product Error:', error);
        res.json({ success: false, message: error.message || "Failed to remove product" })
    }
}

// function for single product info
export const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, product })
    } catch (error) {
        console.error('Single Product Error:', error);
        res.json({ success: false, message: error.message || "Failed to fetch product" })
    }
}

// PUT /api/products/:id - Update product
export const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { customId, name, description, price, category, subCategory, type, sizes, bestseller, originalPrice, categorySlug, features, isNewArrival, isBestSeller, stock, sleeveType } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // If customId is being updated, check uniqueness
        if (customId && customId !== product.customId) {
            const exists = await productModel.findOne({ customId });
            if (exists) {
                return res.status(400).json({ success: false, message: "Custom product ID already exists" });
            }
            product.customId = customId;
        }

        // Validate sleeveType if provided - only for categories that require it
        const validSleeveTypes = ["Puff Sleeve", "Normal Sleeve"];
        const categoriesRequiringSleeveType = [
            "Zipless Feeding Lounge Wear",
            "Non-Feeding Lounge Wear", 
            "Zipless Feeding Dupatta Lounge Wear"
        ];
        
        // Get the category being updated (use provided category or existing product category)
        const updatedCategory = category || product.category;
        
        // Only validate sleeveType if the category requires it
        if (categoriesRequiringSleeveType.includes(updatedCategory)) {
            if (sleeveType !== undefined && sleeveType !== null && sleeveType !== "" && !validSleeveTypes.includes(sleeveType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid sleeve type. Must be 'Puff Sleeve' or 'Normal Sleeve'"
                });
            }
        } else {
            // For categories that don't require sleeveType, clear it if provided
            if (sleeveType !== undefined) {
                // Allow clearing sleeveType for non-sleeve categories
                console.log(`Clearing sleeveType for category: ${updatedCategory}`);
            }
        }

        // Parse features if provided
        let parsedFeatures = product.features || [];
        if (features) {
            try {
                parsedFeatures = JSON.parse(features);
                if (!Array.isArray(parsedFeatures)) {
                    throw new Error('Features must be an array');
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid features format",
                    error: error.message
                });
            }
        }

        // 🔧 FIX: Validate price if provided to prevent negative totals
        if (price !== undefined) {
            const numericPrice = Number(price);
            if (isNaN(numericPrice) || numericPrice <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a positive number"
                });
            }
            // 🔧 REMOVED: Minimum price restriction for testing purposes
            // Users can now set any price >= 1 for testing
        }

        // Handle image uploads if provided
        let imagesUrl = product.images;
        let imageOptimizationStats = null;
        
        if (req.files && Object.keys(req.files).length > 0) {
            const image1 = req.files?.image1?.[0]
            const image2 = req.files?.image2?.[0]
            const image3 = req.files?.image3?.[0]
            const image4 = req.files?.image4?.[0]

            const newImages = [image1, image2, image3, image4].filter((item) => item !== undefined)

            if (newImages.length > 0) {
                try {
                    // Optimize new images
                    console.log('🔄 Starting image optimization for update...');
                    const uploadDir = "/var/www/shithaa-ecom/uploads/products/";
                    const optimizationResult = await imageOptimizer.optimizeMultipleImages(newImages, uploadDir);
                    
                    const { optimizedFiles, results } = optimizationResult;
                    const stats = imageOptimizer.getOptimizationStats(results);

                    console.log('📊 FAST Image Optimization Summary (Update):');
                    console.log(`   Total files: ${stats.totalFiles}`);
                    console.log(`   Successful: ${stats.successful}`);
                    console.log(`   Failed: ${stats.failed}`);
                    console.log(`   Average compression: ${stats.avgCompressionRatio}%`);
                    console.log(`   Total processing time: ${stats.totalProcessingTime}ms`);

                    // Build responsive image URLs using optimized filenames
                    const baseUrl = process.env.BASE_URL || 'https://shithaa.in';
                    const uploadedImages = optimizedFiles.map(img => {
                        const baseFilename = path.parse(img.filename).name;
                        return imageOptimizer.generateResponsiveUrls(baseFilename, baseUrl);
                    });
                    imagesUrl = uploadedImages;
                    
                    // Store optimization stats for response
                    imageOptimizationStats = {
                        stats,
                        details: results.map(result => ({
                            originalName: result.originalName,
                            optimizedName: result.optimizedName,
                            originalSize: imageOptimizer.formatFileSize(result.originalSize),
                            optimizedSize: imageOptimizer.formatFileSize(result.optimizedSize),
                            compressionRatio: result.compressionRatio,
                            processingTime: result.processingTime
                        }))
                    };
                    
                } catch (error) {
                    console.error('Image optimization error in update:', error);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to optimize images",
                        error: error.message
                    });
                }
            }
        }

        const updateData = {
            name: name || product.name,
            description: description || product.description,
            price: price ? Number(price) : product.price,
            originalPrice: originalPrice ? Number(originalPrice) : product.originalPrice,
            category: category || product.category,
            categorySlug: categorySlug || product.categorySlug,
            subCategory: subCategory || product.subCategory,
            type: type || product.type,
            // Ensure both bestseller and isBestSeller are set for compatibility
            bestseller: (bestseller !== undefined ? bestseller === "true" : product.bestseller) || (isBestSeller !== undefined ? isBestSeller === "true" : product.isBestSeller),
            isBestSeller: (bestseller !== undefined ? bestseller === "true" : product.bestseller) || (isBestSeller !== undefined ? isBestSeller === "true" : product.isBestSeller),
            isNewArrival: isNewArrival !== undefined ? isNewArrival === "true" : product.isNewArrival,
            features: parsedFeatures,
            images: imagesUrl,
            updatedAt: new Date(),
            ...(stock !== undefined ? { stock: Number(stock) } : {}),
            // Handle sleeveType conditionally based on category
            ...(categoriesRequiringSleeveType.includes(updatedCategory) 
                ? { sleeveType: sleeveType !== undefined ? (sleeveType || null) : product.sleeveType }
                : { sleeveType: null } // Clear sleeveType for non-sleeve categories
            )
        };

        // Only update sizes if explicitly provided
        if (sizes) {
            try {
                const newSizes = JSON.parse(sizes);
                if (!Array.isArray(newSizes)) throw new Error('Sizes must be an array');
                updateData.sizes = newSizes;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid sizes format",
                    error: error.message
                });
            }
        }

        // In updateProduct, after parsing newSizes (if provided), always sync main stock field
        if (updateData.sizes) {
            updateData.stock = Array.isArray(updateData.sizes) ? updateData.sizes.reduce((sum, s) => sum + (s.stock || 0), 0) : 0;
        }

        const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });
        
        // Return response with optimization stats if images were processed
        const response = { success: true, product: updatedProduct };
        if (imageOptimizationStats) {
            response.imageOptimization = imageOptimizationStats;
        }
        
        res.status(200).json(response);

    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Batch update product order
export const reorderProducts = async (req, res) => {
  try {
    let { products, categorySlug } = req.body;
    console.log('Reorder request:', { products: products?.length, categorySlug });
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: products must be an array' });
    }
    if (!categorySlug) {
      return res.status(400).json({ success: false, message: 'categorySlug is required' });
    }
    
    // Get all products in the category (both by categorySlug and category name)
    const dbProducts = await productModel.find({
      $or: [
        { categorySlug: categorySlug },
        { category: categorySlug }
      ]
    });
    
    console.log('Found products in category:', dbProducts.length);
    const dbIds = dbProducts.map(p => String(p._id));
    
    // Filter input to only those in this category
    products = products.filter(p => dbIds.includes(String(p._id)));
    console.log('Filtered products to update:', products.length);
    
    // Sort and reassign displayOrder with buffer
    products = products
      .filter(p => p._id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p, i) => ({ ...p, displayOrder: (i + 1) * 10 }));
    // Prepare bulk ops - remove categorySlug filter to be more flexible
    const ops = products.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { displayOrder: p.displayOrder } }
      }
    }));
    
    if (ops.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products to reorder for this category' });
    }
    
    console.log('Updating products with ops:', ops.length);
    await productModel.bulkWrite(ops);
    
    // Fetch updated products to return
    const updatedProducts = await productModel.find({
      _id: { $in: products.map(p => p._id) }
    }).sort({ displayOrder: 1 });
    
    console.log('Successfully updated, updatedProducts.length:', updatedProducts.length, 'products');
    res.status(200).json({ success: true, message: 'Product order updated for category', products: updatedProducts });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Move product to top or bottom of category
export const moveProduct = async (req, res) => {
  try {
    const { productId, action, categorySlug } = req.body;
    console.log('Move product request:', { productId, action, categorySlug });
    
    if (!productId || !action || !categorySlug) {
      return res.status(400).json({ 
        success: false, 
        message: 'productId, action (top/bottom), and categorySlug are required' 
      });
    }
    
    if (!['top', 'bottom'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'action must be either "top" or "bottom"' 
      });
    }

    // Validate productId format
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Get the product to move
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Get all products in the category
    const categoryProducts = await productModel.find({
      $or: [
        { categorySlug: categorySlug },
        { category: categorySlug }
      ]
    }).sort({ displayOrder: 1 });
    
    console.log('Found products in category:', categoryProducts.length);
    
    if (categoryProducts.length === 0) {
      return res.status(400).json({ success: false, message: 'No products found in category' });
    }
    
    // Remove the product from current position
    const productsWithoutTarget = categoryProducts.filter(p => String(p._id) !== String(productId));
    
    let newOrder;
    if (action === 'top') {
      // Move to top (displayOrder: 0)
      newOrder = [
        { _id: productId, displayOrder: 0 },
        ...productsWithoutTarget.map((p, i) => ({ _id: p._id, displayOrder: (i + 1) * 10 }))
      ];
    } else {
      // Move to bottom (highest displayOrder + 10)
      const maxOrder = Math.max(...productsWithoutTarget.map(p => p.displayOrder || 0), 0);
      newOrder = [
        ...productsWithoutTarget.map((p, i) => ({ _id: p._id, displayOrder: i * 10 })),
        { _id: productId, displayOrder: maxOrder + 10 }
      ];
    }
    
    // Prepare bulk operations
    const ops = newOrder.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { displayOrder: p.displayOrder } }
      }
    }));
    
    console.log('Updating products with ops:', ops.length);
    await productModel.bulkWrite(ops);
    
    // Fetch updated products to return
    const updatedProducts = await productModel.find({
      _id: { $in: newOrder.map(p => p._id) }
    }).sort({ displayOrder: 1 });
    
    console.log('Successfully moved product, updatedProducts.length:', updatedProducts.length);
    res.status(200).json({ 
      success: true, 
      message: `Product moved to ${action} of category`, 
      products: updatedProducts 
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
        
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `${customId}_${field}_${Date.now()}${fileExtension}`;
        const filePath = path.join(productUploadDir, fileName);
        
        // Save file to VPS upload folder
        fs.writeFileSync(filePath, file.buffer);
        console.log(`🔧 DEBUG: Saved ${field} to:`, filePath);
        
        // Generate URL for the saved image
        const imageUrl = `${process.env.BASE_URL || 'https://jjtextiles.com'}/uploads/products/${fileName}`;
        images.push(imageUrl);
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
export const updateProduct = async (req, res) => {
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
      customId,
      name,
      description,
      price,
      category,
      categorySlug,
      bestseller,
      sizes,
      availableSizes,
      sleeveType
    } = req.body;
    
    // Update product fields
    if (customId) product.customId = customId;
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (categorySlug) product.categorySlug = categorySlug;
    if (bestseller !== undefined) product.bestseller = bestseller === 'true';
    if (sizes) {
      try {
        product.sizes = JSON.parse(sizes);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sizes format'
        });
      }
    }
    if (availableSizes) {
      try {
        product.availableSizes = JSON.parse(availableSizes);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid availableSizes format'
        });
      }
    }
    if (sleeveType !== undefined) product.sleeveType = sleeveType;
    
    // Process uploaded images if any
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
        
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `${product.customId}_${field}_${Date.now()}${fileExtension}`;
        const filePath = path.join(productUploadDir, fileName);
        
        // Save file to VPS upload folder
        fs.writeFileSync(filePath, file.buffer);
        console.log(`🔧 DEBUG: Saved ${field} to:`, filePath);
        
        // Generate URL for the saved image
        const imageUrl = `${process.env.BASE_URL || 'https://jjtextiles.com'}/uploads/products/${fileName}`;
        
        // Update the corresponding image in the product
        const imageIndex = parseInt(field.replace('image', '')) - 1;
        if (!product.images) product.images = [];
        product.images[imageIndex] = imageUrl;
      }
    }
    
    // Update timestamp
    product.updatedAt = new Date();
    
    // Save updated product
    const updatedProduct = await product.save();
    console.log('🔧 DEBUG: Product updated successfully:', updatedProduct.customId);
    
    res.status(200).json({
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
 * DELETE /api/products/:id - Remove product by ID
 */
export const removeProduct = async (req, res) => {
  try {
    console.log('🔧 DEBUG: removeProduct called for ID:', req.params.id);
    
    const productId = req.params.id;
    
    // Find and delete product
    const deletedProduct = await productModel.findByIdAndDelete(productId);
    
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log('🔧 DEBUG: Product deleted successfully:', deletedProduct.customId);
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      product: deletedProduct
    });
    
  } catch (error) {
    console.error('Remove product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove product'
    });
  }
};