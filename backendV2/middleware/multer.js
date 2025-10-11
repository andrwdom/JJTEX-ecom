import multer from "multer";
import path from "path";

// SECURITY: Use memory storage to get file buffers for processing
const storage = multer.memoryStorage();

// SECURITY: File type validation - only allow safe image formats
const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
]);

const fileFilter = (req, file, cb) => {
    // SECURITY: Validate MIME type and reject unsafe files
    if (allowedMimeTypes.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed. Only JPEG, PNG, and WebP images are accepted.`), false);
    }
};

// SECURITY: Configure multer with security limits
const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 4 // Maximum 4 files per request
    }
});

export default upload;