import express from 'express';
import {
    getProductsUltraFast,
    getProductsInstant,
    preloadProducts,
    searchProductsInstant,
    warmCache,
    invalidateCache,
    getPerformanceStats
} from '../controllers/productControllerUltraFast.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// =====================================================================================
// 🚀 ULTRA-FAST PRODUCT ROUTES - Amazon-Level Performance
// =====================================================================================

/**
 * GET /api/products/ultra-fast
 * Lightning fast product loading with aggressive caching
 * Response time: < 100ms (cached), < 500ms (uncached)
 */
router.get('/ultra-fast', getProductsUltraFast);

/**
 * GET /api/products/instant
 * Instant product loading with precomputed data
 * Response time: < 50ms (cached), < 200ms (uncached)
 */
router.get('/instant', getProductsInstant);

/**
 * GET /api/products/preload
 * Preload products for instant navigation
 * Query params: categorySlug, limit
 */
router.get('/preload', preloadProducts);

/**
 * GET /api/products/search-instant
 * Instant search with MongoDB text indexes
 * Query params: q (search query), limit
 */
router.get('/search-instant', searchProductsInstant);

// =====================================================================================
// 🛠️ CACHE MANAGEMENT ROUTES
// =====================================================================================

/**
 * POST /api/products/warm-cache
 * Warm all critical caches for optimal performance
 * Protected route - requires authentication
 */
router.post('/warm-cache', verifyToken, warmCache);

/**
 * DELETE /api/products/invalidate-cache
 * Invalidate all product caches
 * Protected route - requires authentication
 */
router.delete('/invalidate-cache', verifyToken, invalidateCache);

/**
 * GET /api/products/performance
 * Get performance statistics and cache metrics
 */
router.get('/performance', getPerformanceStats);

export default router;
