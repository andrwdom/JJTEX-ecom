import express from 'express';
import { getCarouselBanners, createCarouselBanner, updateCarouselBanner, deleteCarouselBanner, updateBannerOrder } from '../controllers/carouselController.js';
import { isAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Add file filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Public route to get all active banners
router.get('/', getCarouselBanners);

// Admin routes
router.post('/', isAdmin, upload.single('image'), createCarouselBanner);
router.put('/:id', isAdmin, upload.single('image'), updateCarouselBanner);
router.delete('/:id', isAdmin, deleteCarouselBanner);
router.put('/order/update', isAdmin, updateBannerOrder);

export default router; 