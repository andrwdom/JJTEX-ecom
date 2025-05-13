import CarouselBanner from '../models/CarouselBanner.js';
import { cloudinary } from '../config/cloudinary.js';
import fs from 'fs';

// Get all carousel banners
export const getCarouselBanners = async (req, res) => {
  try {
    const banners = await CarouselBanner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new carousel banner
export const createCarouselBanner = async (req, res) => {
  try {
    const { title, description, sectionId, order } = req.body;
    const imageFile = req.file;

    console.log('Creating banner with:', { title, description, sectionId, order });
    console.log('Image file:', imageFile ? { 
      path: imageFile.path,
      mimetype: imageFile.mimetype,
      size: imageFile.size 
    } : 'No image file');

    if (!imageFile) {
      return res.status(400).json({ message: 'Image is required' });
    }

    try {
      console.log('Attempting to upload to Cloudinary...');
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'carousel_banners',
        width: 1920,
        height: 800,
        crop: 'fill'
      });
      console.log('Cloudinary upload successful:', result.secure_url);

      const banner = new CarouselBanner({
        image: result.secure_url,
        title,
        description,
        sectionId,
        order: order || 0
      });

      await banner.save();
      console.log('Banner saved to database:', banner._id);
      
      // Delete the local file after successful upload to Cloudinary
      fs.unlink(imageFile.path, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
        } else {
          console.log('Local file deleted successfully');
        }
      });

      res.status(201).json(banner);
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      // If Cloudinary upload fails, delete the local file and return error
      fs.unlink(imageFile.path, (err) => {
        if (err) console.error('Error deleting local file:', err);
      });
      throw new Error(`Failed to upload image to Cloudinary: ${cloudinaryError.message}`);
    }
  } catch (error) {
    console.error('Banner creation error:', error);
    res.status(400).json({ 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update a carousel banner
export const updateCarouselBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sectionId, order, isActive } = req.body;
    const imageFile = req.file;

    const updateData = {
      title,
      description,
      sectionId,
      order,
      isActive
    };

    if (imageFile) {
      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'carousel_banners',
        width: 1920,
        height: 800,
        crop: 'fill'
      });
      updateData.image = result.secure_url;
    }

    const banner = await CarouselBanner.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a carousel banner
export const deleteCarouselBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await CarouselBanner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Delete image from Cloudinary
    const publicId = banner.image.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update banner order
export const updateBannerOrder = async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, order } objects

    const updatePromises = orders.map(({ id, order }) =>
      CarouselBanner.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Banner order updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 