import CarouselBanner from '../models/CarouselBanner.js';
import fs from 'fs';
import path from 'path';

// Get all carousel banners
export const getCarouselBanners = async (req, res) => {
  try {
    // Check if this is an admin request (has admin middleware)
    const isAdminRequest = req.user && req.user.role === 'admin';
    
    let banners;
    if (isAdminRequest) {
      // Admin gets all banners (including inactive ones)
      banners = await CarouselBanner.find({}).sort({ order: 1 });
    } else {
      // Public gets only active banners
      banners = await CarouselBanner.find({ isActive: { $ne: false } }).sort({ order: 1 });
    }
    
    // If no banners found, return sample data for frontend
    if (!banners || banners.length === 0) {
      const sampleCarousels = [
        {
          id: 'sample-1',
          url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
          alt: 'Fashion Collection 1',
          title: 'New Arrivals',
          link: '/collections/new-arrivals',
          order: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sample-2',
          url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop',
          alt: 'Fashion Collection 2',
          title: 'Summer Styles',
          link: '/collections/summer',
          order: 2,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        data: sampleCarousels,
        message: 'Carousel images retrieved successfully (sample data)'
      });
    }
    
    // Transform data to match frontend expectations
    const carouselData = banners.map(banner => ({
      id: banner._id.toString(),
      url: banner.image,
      alt: banner.title || 'Carousel banner',
      title: banner.title,
      link: banner.link || null,
      order: banner.order || 0,
      isActive: banner.isActive !== false,
      createdAt: banner.createdAt?.toISOString(),
      updatedAt: banner.updatedAt?.toISOString()
    }));

    res.json({
      success: true,
      data: carouselData,
      message: 'Carousel images retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching carousel banners:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch carousel images',
      error: error.message 
    });
  }
};

// Create a new carousel banner
export const createCarouselBanner = async (req, res) => {
  try {
    const { title, description, link, sectionId, order, isActive } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ message: 'Image is required' });
    }

    try {
      // Create carousel directory if it doesn't exist
      const carouselDir = path.join(process.env.UPLOAD_DIR || '/var/www/jjtex-ecom/uploads', 'carousel');
      if (!fs.existsSync(carouselDir)) {
        fs.mkdirSync(carouselDir, { recursive: true });
      }

      // Save image to VPS storage
      const fileName = `carousel_${Date.now()}_${imageFile.originalname}`;
      const filePath = path.join(carouselDir, fileName);
      
      fs.writeFileSync(filePath, imageFile.buffer);
      
      const baseUrl = process.env.BASE_URL || 'https://api.jjtextiles.com';
      const imageUrl = `${baseUrl}/uploads/carousel/${fileName}`;

      const banner = new CarouselBanner({
        image: imageUrl,
        title,
        description,
        link: link || null,
        sectionId: sectionId || null,
        order: order || 0,
        isActive: isActive === 'true' || isActive === true || isActive === undefined
      });

      await banner.save();
      res.status(201).json(banner);
    } catch (uploadError) {
      console.error('VPS upload error:', uploadError);
      throw new Error(`Failed to upload image to VPS: ${uploadError.message}`);
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
    const { title, description, link, sectionId, order, isActive } = req.body;
    const imageFile = req.file;

    const updateData = {
      title,
      description,
      link,
      sectionId,
      order,
      isActive: isActive === 'true' || isActive === true
    };

    if (imageFile) {
      // Create carousel directory if it doesn't exist
      const carouselDir = path.join(process.env.UPLOAD_DIR || '/var/www/jjtex-ecom/uploads', 'carousel');
      if (!fs.existsSync(carouselDir)) {
        fs.mkdirSync(carouselDir, { recursive: true });
      }

      // Save new image to VPS storage
      const fileName = `carousel_${Date.now()}_${imageFile.originalname}`;
      const filePath = path.join(carouselDir, fileName);
      
      fs.writeFileSync(filePath, imageFile.buffer);
      
      const baseUrl = process.env.BASE_URL || 'https://api.jjtextiles.com';
      const imageUrl = `${baseUrl}/uploads/carousel/${fileName}`;
      updateData.image = imageUrl;
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
    console.error('Update banner error:', error);
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

    // Delete image from VPS storage
    try {
      const imagePath = banner.image;
      if (imagePath && imagePath.includes('/uploads/carousel/')) {
        const fileName = imagePath.split('/uploads/carousel/')[1];
        const filePath = path.join(process.env.UPLOAD_DIR || '/var/www/jjtex-ecom/uploads', 'carousel', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (fileError) {
      console.error('Error deleting image file:', fileError);
      // Continue with deletion even if file deletion fails
    }

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update banner order
export const updateBannerOrder = async (req, res) => {
  try {
    const { orders } = req.body;

    const updatePromises = orders.map(({ id, order }) =>
      CarouselBanner.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Banner order updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 