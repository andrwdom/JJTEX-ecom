import express from 'express'
import { listProducts, addProduct, removeProduct, singleProduct, updateProduct } from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import { isAdmin } from '../middleware/auth.js';

const productRouter = express.Router();

// Admin routes - protected with isAdmin middleware
productRouter.post('/add',isAdmin,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),addProduct);
productRouter.post('/remove',isAdmin,removeProduct);
productRouter.post('/single',singleProduct);
productRouter.post('/update',isAdmin,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),updateProduct);

// Public routes
productRouter.get('/list',listProducts)

export default productRouter