import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// function for add product
const addProduct = async (req, res) => {
    try {
        console.log('Add Product Request Body:', req.body);
        console.log('Add Product Files:', req.files);

        const { name, description, price, category, subCategory, type, sizes, bestseller } = req.body

        // Validate required fields
        if (!name || !description || !price || !category || !subCategory || !type) {
            console.log('Missing fields:', {
                name: !name,
                description: !description,
                price: !price,
                category: !category,
                subCategory: !subCategory,
                type: !type
            });
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields",
                missing: {
                    name: !name,
                    description: !description,
                    price: !price,
                    category: !category,
                    subCategory: !subCategory,
                    type: !type
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
            console.log('Parsed sizes:', parsedSizes);
        } catch (error) {
            console.error('Sizes parsing error:', error);
            return res.status(400).json({
                success: false,
                message: "Invalid sizes format",
                error: error.message
            });
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

        // Upload images to cloudinary
        let imagesUrl;
        try {
            console.log('Starting image upload to Cloudinary');
            imagesUrl = await Promise.all(
                images.map(async (item) => {
                    if (!item.path) {
                        console.error('Invalid image file:', item);
                        throw new Error('Invalid image file');
                    }
                    console.log('Uploading image:', item.path);
                    let result = await cloudinary.uploader.upload(item.path, { 
                        resource_type: 'image',
                        folder: 'jjtextiles/products'
                    });
                    console.log('Image uploaded successfully:', result.secure_url);
                    return result.secure_url;
                })
            );
            console.log('All images uploaded successfully:', imagesUrl);
        } catch (error) {
            console.error('Cloudinary Upload Error:', error);
            return res.status(500).json({
                success: false,
                message: "Failed to upload images",
                error: error.message
            });
        }

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            type,
            bestseller: bestseller === "true" ? true : false,
            sizes: parsedSizes,
            image: imagesUrl,
            date: Date.now()
        }

        console.log('Creating product with data:', productData);

        const product = new productModel(productData);
        await product.save();

        console.log('Product saved successfully:', product._id);

        res.status(201).json({ 
            success: true, 
            message: "Product Added Successfully",
            product: {
                id: product._id,
                name: product.name,
                price: product.price
            }
        });
    } catch (error) {
        console.error('Add Product Error:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            files: req.files
        });
        res.status(500).json({ 
            success: false, 
            message: "Failed to add product",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// function for list product
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({}).sort({ date: -1 });
        res.json({ success: true, products })
    } catch (error) {
        console.error('List Products Error:', error);
        res.json({ success: false, message: error.message || "Failed to fetch products" })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        await productModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Product Removed Successfully" })
    } catch (error) {
        console.error('Remove Product Error:', error);
        res.json({ success: false, message: error.message || "Failed to remove product" })
    }
}

// function for single product info
const singleProduct = async (req, res) => {
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

// function for updating product
const updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, category, subCategory, type, sizes, bestseller } = req.body;

        if (!id || !name || !description || !price || !category || !subCategory || !type) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        const image1 = req.files?.image1?.[0]
        const image2 = req.files?.image2?.[0]
        const image3 = req.files?.image3?.[0]
        const image4 = req.files?.image4?.[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)
        
        let updateData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            type,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes)
        }

        if (images.length > 0) {
            const imagesUrl = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url
                })
            )
            updateData.image = imagesUrl
        }

        await productModel.findByIdAndUpdate(id, updateData)
        res.json({ success: true, message: "Product Updated Successfully" })
    } catch (error) {
        console.error('Update Product Error:', error);
        res.json({ success: false, message: error.message || "Failed to update product" })
    }
}

export { listProducts, addProduct, removeProduct, singleProduct, updateProduct }