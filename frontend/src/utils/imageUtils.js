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
