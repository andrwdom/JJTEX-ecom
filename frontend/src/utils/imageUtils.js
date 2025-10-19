/**
 * Image URL utilities for fixing inconsistent image URLs
 */

/**
 * Fix image URLs to use the correct domain and path structure
 * @param {string} url - The image URL to fix
 * @returns {string} - The fixed image URL
 */
export const fixImageUrl = (url) => {
  if (!url) return url
  
  // Fix domain issues
  let fixedUrl = url.replace('https://jjtextiles.com/', 'https://api.jjtextiles.com/')
  
  // Don't change the path structure - backendV2 serves both /images and /uploads routes
  // Just ensure the domain is correct
  return fixedUrl
}

/**
 * Fix multiple image URLs in an array
 * @param {Array} urls - Array of image URLs to fix
 * @returns {Array} - Array of fixed image URLs
 */
export const fixImageUrls = (urls) => {
  if (!Array.isArray(urls)) return urls
  return urls.map(url => fixImageUrl(url))
}

/**
 * Get the first image URL from a product, with URL fixing
 * @param {Object} product - The product object
 * @returns {string|null} - The first image URL or null
 */
export const getProductImage = (product) => {
  if (!product) return null
  
  // Try different image field names
  const imageUrl = product.images?.[0] || product.image?.[0] || product.images || product.image
  
  if (Array.isArray(imageUrl)) {
    return fixImageUrl(imageUrl[0])
  }
  
  return fixImageUrl(imageUrl)
}

/**
 * Generate a data URL for placeholder images
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Placeholder text
 * @returns {string} - Data URL for placeholder image
 */
export const generatePlaceholderImage = (width = 300, height = 400, text = 'Image Not Available') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Get fallback image URL
 * @param {string} type - Type of fallback image
 * @returns {string} - Fallback image URL
 */
export const getFallbackImage = (type = 'product') => {
  const fallbacks = {
    product: generatePlaceholderImage(300, 400, 'Image Not Available'),
    thumbnail: generatePlaceholderImage(64, 64, 'No Image'),
    cart: generatePlaceholderImage(100, 100, 'No Image')
  }
  
  return fallbacks[type] || fallbacks.product
}
