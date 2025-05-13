import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// function for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, type, sizes, bestseller } = req.body

        if (!name || !description || !price || !category || !subCategory || !type) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const image1 = req.files?.image1?.[0]
        const image2 = req.files?.image2?.[0]
        const image3 = req.files?.image3?.[0]
        const image4 = req.files?.image4?.[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        if (images.length === 0) {
            return res.json({ success: false, message: "At least one image is required" });
        }

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            type,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now()
        }

        const product = new productModel(productData);
        await product.save()

        res.json({ success: true, message: "Product Added Successfully" })
    } catch (error) {
        console.error('Add Product Error:', error);
        res.json({ success: false, message: error.message || "Failed to add product" })
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