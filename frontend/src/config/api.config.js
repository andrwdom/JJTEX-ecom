// API Configuration for BackendV2 Migration
// This file centralizes API endpoint management

export const API_CONFIG = {
  // Base URL - can be updated to point to backendV2
  BASE_URL: import.meta.env.VITE_BACKEND_URL || 'https://api.jjtextiles.com',
  
  // API Version
  VERSION: 'v2',
  
  // Endpoints mapping for migration
  ENDPOINTS: {
    // Products
    PRODUCTS: {
      LIST: '/api/products',
      DETAIL: '/api/products/:id',
      LEGACY_LIST: '/api/product/list' // For backward compatibility
    },
    
    // Cart
    CART: {
      GET: '/api/cart/get-items',
      ADD: '/api/cart/add',
      UPDATE: '/api/cart/update',
      REMOVE: '/api/cart/remove',
      VALIDATE: '/api/cart/validate',
      CALCULATE_TOTAL: '/api/cart/calculate-total',
      // Legacy endpoints
      LEGACY_GET: '/api/cart/get',
      LEGACY_ADD: '/api/cart/add',
      LEGACY_UPDATE: '/api/cart/update'
    },
    
    // Orders
    ORDERS: {
      CREATE: '/api/orders',
      GET_USER_ORDERS: '/api/orders/user',
      GET_BY_ID: '/api/orders/:id',
      LEGACY_CREATE: '/api/order',
      LEGACY_USER_ORDERS: '/api/orders/user'
    },
    
    // Checkout (NEW in BackendV2)
    CHECKOUT: {
      CREATE_SESSION: '/api/checkout/create-session',
      GET_SESSION: '/api/checkout/:sessionId',
      UPDATE_SESSION: '/api/checkout/:sessionId',
      RESERVE_STOCK: '/api/checkout/:sessionId/reserve-stock'
    },
    
    // Payment (Enhanced in BackendV2)
    PAYMENT: {
      CREATE_SESSION: '/api/payment/phonepe/create-session',
      CALLBACK: '/api/payment/phonepe/callback',
      VERIFY: '/api/payment/phonepe/verify/:transactionId',
      STATUS: '/api/payment/status/:sessionId',
      REFUND: '/api/payment/phonepe/refund',
      REFUND_STATUS: '/api/payment/phonepe/refund-status/:refundId'
    },
    
    // User
    USER: {
      PROFILE: '/api/auth/profile',
      UPDATE_PROFILE: '/api/auth/profile',
      REGISTER: '/api/user/register',
      LOGIN: '/api/user/login',
      LEGACY_PROFILE: '/api/user/profile'
    },
    
    // Categories
    CATEGORIES: {
      LIST: '/api/categories',
      DETAIL: '/api/categories/:slug',
      PRODUCTS: '/api/categories/:slug/products'
    },
    
    // Coupons
    COUPONS: {
      VALIDATE: '/api/coupons/validate'
    },
    
    // Contact
    CONTACT: {
      SUBMIT: '/api/contact'
    },
    
    // Carousel
    CAROUSEL: {
      LIST: '/api/carousel'
    },
    
    // Stock Management (NEW in BackendV2)
    STOCK: {
      CHECK: '/api/stock/check',
      RESERVE: '/api/stock/reserve',
      RELEASE: '/api/stock/release',
      CONFIRM: '/api/stock/confirm'
    }
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Replace parameters in URL
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Helper function to get endpoint URL
export const getEndpoint = (category, action, params = {}) => {
  const endpoint = API_CONFIG.ENDPOINTS[category]?.[action];
  if (!endpoint) {
    throw new Error(`Endpoint not found: ${category}.${action}`);
  }
  return buildApiUrl(endpoint, params);
};

// Migration helper - determines if we should use legacy or new endpoints
export const useLegacyEndpoints = () => {
  // This can be controlled by environment variable or feature flag
  return import.meta.env.VITE_USE_LEGACY_API === 'true';
};

// Get the appropriate endpoint based on migration status
export const getApiEndpoint = (category, action, params = {}) => {
  const useLegacy = useLegacyEndpoints();
  const legacyAction = `LEGACY_${action}`;
  
  if (useLegacy && API_CONFIG.ENDPOINTS[category]?.[legacyAction]) {
    return getEndpoint(category, legacyAction, params);
  }
  
  return getEndpoint(category, action, params);
};

export default API_CONFIG;
