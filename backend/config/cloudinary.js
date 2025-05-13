import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary immediately
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

// Keep the connect function for compatibility
const connectCloudinary = async () => {
    // Configuration is already done
    console.log('Cloudinary configured with:', {
        cloud_name: process.env.CLOUDINARY_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasSecretKey: !!process.env.CLOUDINARY_SECRET_KEY
    });
};

export { cloudinary }  // Export the configured instance
export default connectCloudinary;