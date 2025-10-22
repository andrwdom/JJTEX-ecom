/**
 * API Service for BackendV2 Integration
 * Centralized API communication service with automatic fallback
 */

import axios from 'axios';
import { getApiEndpoint, useLegacyEndpoints } from '../config/api.config.js';

class ApiService {
    constructor() {
        this.baseURL = import.meta.env.VITE_BACKEND_URL || 'https://api.jjtextiles.com';
        this.useLegacy = useLegacyEndpoints();
        this.setupAxios();
    }

    setupAxios() {
        // Create axios instance
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000, // Reduced from 30s to 10s for better UX
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Add authentication token
                const token = localStorage.getItem('token');
                if (token) {
                    if (this.useLegacy) {
                        config.headers.token = token;
                    } else {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }

                // Add request ID for tracking
                config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                if (error.response?.status === 401) {
                    // Handle authentication errors
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }

                // Retry logic for server errors
                if (error.response?.status >= 500 && error.config && !error.config.__retryCount) {
                    error.config.__retryCount = 1;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.client(error.config);
                }

                return Promise.reject(error);
            }
        );
    }

    // Generic request method
    async request(method, endpoint, data = null, options = {}) {
        try {
            const config = {
                method,
                url: endpoint,
                ...options
            };

            if (data) {
                if (method.toLowerCase() === 'get') {
                    config.params = data;
                } else {
                    config.data = data;
                }
            }

            const response = await this.client(config);
            return response.data;
        } catch (error) {
            console.error(`API ${method} ${endpoint} failed:`, error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        return this.request('GET', endpoint, params);
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request('POST', endpoint, data);
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request('PUT', endpoint, data);
    }

    // DELETE request
    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }

    // Products API
    async getProducts(params = {}) {
        // Use fast endpoint for initial load if no specific filters
        const useFastEndpoint = !params.search && !params.categorySlug && !params.size && 
                               !params.minPrice && !params.maxPrice && !params.isNewArrival && 
                               !params.isBestSeller && !params.sleeveType;
        
        const endpoint = useFastEndpoint 
            ? '/api/products/fast'
            : (this.useLegacy 
                ? getApiEndpoint('PRODUCTS', 'LEGACY_LIST')
                : getApiEndpoint('PRODUCTS', 'LIST'));
        
        const response = await this.get(endpoint, params);
        
        // Normalize response format
        if (this.useLegacy) {
            return {
                success: true,
                data: response.products || [],
                total: response.products?.length || 0,
                page: 1,
                totalPages: 1
            };
        }
        
        return response;
    }

    async getProduct(id) {
        const endpoint = getApiEndpoint('PRODUCTS', 'DETAIL', { id });
        return this.get(endpoint);
    }

    // Cart API
    async getCart(userId) {
        const endpoint = this.useLegacy 
            ? getApiEndpoint('CART', 'LEGACY_GET')
            : getApiEndpoint('CART', 'GET');
        
        const response = await this.post(endpoint, { userId });
        
        // Normalize response format
        if (this.useLegacy) {
            return {
                success: true,
                cartData: response.cartData || {}
            };
        }
        
        return response;
    }

    async addToCart(userId, itemId, size, quantity = 1) {
        const endpoint = this.useLegacy 
            ? getApiEndpoint('CART', 'LEGACY_ADD')
            : getApiEndpoint('CART', 'ADD');
        
        const payload = this.useLegacy 
            ? { userId, itemId, size }
            : { userId, itemId, size, quantity };
        
        return this.post(endpoint, payload);
    }

    async updateCart(userId, itemId, size, quantity) {
        const endpoint = this.useLegacy 
            ? getApiEndpoint('CART', 'LEGACY_UPDATE')
            : getApiEndpoint('CART', 'UPDATE');
        
        return this.post(endpoint, { userId, itemId, size, quantity });
    }

    async removeFromCart(userId, itemId, size) {
        const endpoint = getApiEndpoint('CART', 'REMOVE');
        return this.post(endpoint, { userId, itemId, size });
    }

    async validateCart(userId) {
        const endpoint = getApiEndpoint('CART', 'VALIDATE');
        return this.post(endpoint, { userId });
    }

    async calculateCartTotal(userId) {
        const endpoint = getApiEndpoint('CART', 'CALCULATE_TOTAL');
        return this.post(endpoint, { userId });
    }

    // Orders API
    async createOrder(orderData) {
        const endpoint = this.useLegacy 
            ? getApiEndpoint('ORDERS', 'LEGACY_CREATE')
            : getApiEndpoint('ORDERS', 'CREATE');
        
        return this.post(endpoint, orderData);
    }

    async getUserOrders(userId) {
        const endpoint = this.useLegacy 
            ? getApiEndpoint('ORDERS', 'LEGACY_USER_ORDERS')
            : getApiEndpoint('ORDERS', 'GET_USER_ORDERS');
        
        return this.get(endpoint, { userId });
    }

    async getOrder(orderId) {
        const endpoint = getApiEndpoint('ORDERS', 'GET_BY_ID', { id: orderId });
        return this.get(endpoint);
    }

    // Payment API
    async createPaymentSession(sessionData) {
        const endpoint = getApiEndpoint('PAYMENT', 'CREATE_SESSION');
        return this.post(endpoint, sessionData);
    }

    async verifyPayment(transactionId) {
        const endpoint = getApiEndpoint('PAYMENT', 'VERIFY', { transactionId });
        return this.get(endpoint);
    }

    async getPaymentStatus(sessionId) {
        const endpoint = getApiEndpoint('PAYMENT', 'STATUS', { sessionId });
        return this.get(endpoint);
    }

    // Checkout API (New in BackendV2)
    async createCheckoutSession(sessionData) {
        const endpoint = getApiEndpoint('CHECKOUT', 'CREATE_SESSION');
        return this.post(endpoint, sessionData);
    }

    async getCheckoutSession(sessionId) {
        const endpoint = getApiEndpoint('CHECKOUT', 'GET_SESSION', { sessionId });
        return this.get(endpoint);
    }

    async updateCheckoutSession(sessionId, data) {
        const endpoint = getApiEndpoint('CHECKOUT', 'UPDATE_SESSION', { sessionId });
        return this.put(endpoint, data);
    }

    async reserveStock(sessionId) {
        const endpoint = getApiEndpoint('CHECKOUT', 'RESERVE_STOCK', { sessionId });
        return this.post(endpoint);
    }

    // User API
    async getUserProfile() {
        const endpoint = this.useLegacy 
            ? getApiEndpoint('USER', 'LEGACY_PROFILE')
            : getApiEndpoint('USER', 'PROFILE');
        
        return this.get(endpoint);
    }

    async updateUserProfile(data) {
        const endpoint = getApiEndpoint('USER', 'UPDATE_PROFILE');
        return this.put(endpoint, data);
    }

    async register(userData) {
        const endpoint = getApiEndpoint('USER', 'REGISTER');
        return this.post(endpoint, userData);
    }

    async login(credentials) {
        const endpoint = getApiEndpoint('USER', 'LOGIN');
        return this.post(endpoint, credentials);
    }

    // Categories API
    async getCategories() {
        const endpoint = getApiEndpoint('CATEGORIES', 'LIST');
        return this.get(endpoint);
    }

    async getCategory(slug) {
        const endpoint = getApiEndpoint('CATEGORIES', 'DETAIL', { slug });
        return this.get(endpoint);
    }

    async getCategoryProducts(slug, params = {}) {
        const endpoint = getApiEndpoint('CATEGORIES', 'PRODUCTS', { slug });
        return this.get(endpoint, params);
    }

    // Coupons API
    async validateCoupon(code) {
        const endpoint = getApiEndpoint('COUPONS', 'VALIDATE');
        return this.post(endpoint, { code });
    }

    // Contact API
    async submitContact(data) {
        const endpoint = getApiEndpoint('CONTACT', 'SUBMIT');
        return this.post(endpoint, data);
    }

    // Carousel API
    async getCarousel() {
        const endpoint = getApiEndpoint('CAROUSEL', 'LIST');
        return this.get(endpoint);
    }

    // Stock API (New in BackendV2)
    async checkStock(items) {
        const endpoint = getApiEndpoint('STOCK', 'CHECK');
        return this.post(endpoint, { items });
    }

    async reserveStock(items) {
        const endpoint = getApiEndpoint('STOCK', 'RESERVE');
        return this.post(endpoint, { items });
    }

    async releaseStock(items) {
        const endpoint = getApiEndpoint('STOCK', 'RELEASE');
        return this.post(endpoint, { items });
    }

    async confirmStock(items) {
        const endpoint = getApiEndpoint('STOCK', 'CONFIRM');
        return this.post(endpoint, { items });
    }

    // Health Check
    async healthCheck() {
        return this.get('/api/health');
    }

    // Error handling helper
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.message || error.response.data?.error || 'Server error';
            const status = error.response.status;
            
            return {
                message,
                status,
                data: error.response.data
            };
        } else if (error.request) {
            // Request was made but no response received
            return {
                message: 'Network error - please check your connection',
                status: 0,
                data: null
            };
        } else {
            // Something else happened
            return {
                message: error.message || 'An unexpected error occurred',
                status: 0,
                data: null
            };
        }
    }

    // Utility method to check if using legacy API
    isUsingLegacyAPI() {
        return this.useLegacy;
    }

    // Switch API mode (for testing)
    switchToLegacyAPI() {
        this.useLegacy = true;
        console.log('Switched to legacy API mode');
    }

    switchToNewAPI() {
        this.useLegacy = false;
        console.log('Switched to new API mode');
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };
