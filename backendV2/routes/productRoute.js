import express from 'express'
import {
    listProducts,
    singleProduct,
    getProductById,
    getAllProducts,
    addProduct,
    removeProductV2,
    updateProductV2,
    reorderProducts,
    moveProduct,
    healthCheck
} from '../controllers/productController.js'
import { verifyToken } from '../middleware/auth.js'
import multer from '../middleware/multer.js'

const productRouter = express.Router();

// Health check route
productRouter.get('/health', healthCheck); // GET /api/products/health

// Product ordering routes (must come before :id routes to avoid conflict)
productRouter.put('/reorder', verifyToken, reorderProducts);
productRouter.put('/move', verifyToken, moveProduct);

// Public RESTful routes
productRouter.get('/', getAllProducts); // GET /api/products
productRouter.get('/category/:category', getAllProducts); // GET /api/products/category/:category

// Admin routes with authentication
productRouter.post('/', verifyToken, multer.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), addProduct);

// These ID routes must come last to avoid conflicts with named routes
productRouter.get('/:id', getProductById);
productRouter.delete('/:id', verifyToken, removeProductV2);
productRouter.put('/:id', verifyToken, multer.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), updateProductV2);

export default productRouter