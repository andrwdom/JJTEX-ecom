/**
 * 🚨 EMERGENCY FALLBACK SERVICE
 * 
 * This service provides offline functionality when the server is down:
 * 1. Cached product data for offline browsing
 * 2. Local storage fallback
 * 3. Graceful degradation
 * 4. User-friendly error messages
 */

class EmergencyFallbackService {
    constructor() {
        this.cacheKey = 'emergency_products_cache';
        this.lastUpdateKey = 'emergency_cache_last_update';
        this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Get cached products for offline use
     */
    getCachedProducts() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            const lastUpdate = localStorage.getItem(this.lastUpdateKey);
            
            if (!cached || !lastUpdate) {
                return null;
            }
            
            const age = Date.now() - parseInt(lastUpdate);
            if (age > this.maxCacheAge) {
                console.log('🗑️ Emergency cache expired');
                return null;
            }
            
            const products = JSON.parse(cached);
            console.log(`📦 Emergency cache: ${products.length} products (${Math.round(age / 1000 / 60)} minutes old)`);
            
            return products;
        } catch (error) {
            console.error('❌ Emergency cache error:', error);
            return null;
        }
    }

    /**
     * Save products to emergency cache
     */
    saveProductsToCache(products) {
        try {
            if (Array.isArray(products) && products.length > 0) {
                localStorage.setItem(this.cacheKey, JSON.stringify(products));
                localStorage.setItem(this.lastUpdateKey, Date.now().toString());
                console.log(`💾 Emergency cache updated: ${products.length} products`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to save emergency cache:', error);
            return false;
        }
    }

    /**
     * Get sample products for demo (when no cache available)
     */
    getSampleProducts() {
        return [
            {
                _id: 'sample-1',
                customId: 'SAMPLE-001',
                name: 'Sample Cotton Shirt',
                price: 299,
                category: 'Shirts',
                categorySlug: 'shirts',
                image: '/images/sample-shirt.jpg',
                images: ['/images/sample-shirt.jpg'],
                isNewArrival: true,
                isBestSeller: false,
                sizes: [
                    { size: 'S', stock: 10, reserved: 0 },
                    { size: 'M', stock: 15, reserved: 0 },
                    { size: 'L', stock: 12, reserved: 0 }
                ]
            },
            {
                _id: 'sample-2',
                customId: 'SAMPLE-002',
                name: 'Sample Cotton Dress',
                price: 599,
                category: 'Dresses',
                categorySlug: 'dresses',
                image: '/images/sample-dress.jpg',
                images: ['/images/sample-dress.jpg'],
                isNewArrival: false,
                isBestSeller: true,
                sizes: [
                    { size: 'S', stock: 8, reserved: 0 },
                    { size: 'M', stock: 10, reserved: 0 },
                    { size: 'L', stock: 6, reserved: 0 }
                ]
            },
            {
                _id: 'sample-3',
                customId: 'SAMPLE-003',
                name: 'Sample Cotton Pants',
                price: 399,
                category: 'Pants',
                categorySlug: 'pants',
                image: '/images/sample-pants.jpg',
                images: ['/images/sample-pants.jpg'],
                isNewArrival: false,
                isBestSeller: false,
                sizes: [
                    { size: 'S', stock: 5, reserved: 0 },
                    { size: 'M', stock: 8, reserved: 0 },
                    { size: 'L', stock: 7, reserved: 0 }
                ]
            }
        ];
    }

    /**
     * Get products with fallback strategy
     */
    async getProductsWithFallback() {
        // Try to get cached products first
        const cachedProducts = this.getCachedProducts();
        if (cachedProducts && cachedProducts.length > 0) {
            return {
                success: true,
                products: cachedProducts,
                data: cachedProducts,
                total: cachedProducts.length,
                cached: true,
                offline: true,
                message: 'Using cached data (server offline)'
            };
        }

        // If no cache, return sample products
        const sampleProducts = this.getSampleProducts();
        return {
            success: true,
            products: sampleProducts,
            data: sampleProducts,
            total: sampleProducts.length,
            cached: false,
            offline: true,
            sample: true,
            message: 'Using sample data (server offline)'
        };
    }

    /**
     * Check if server is reachable
     */
    async checkServerHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://api.jjtextiles.com/api/products/health', {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.log('🔍 Server health check failed:', error.message);
            return false;
        }
    }

    /**
     * Show offline notification to user
     */
    showOfflineNotification() {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">⚠️ Server Offline</div>
            <div>We're experiencing technical difficulties. Showing cached products.</div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }
}

export default EmergencyFallbackService;
