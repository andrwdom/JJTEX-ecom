import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/user/admin', { email, password });
    return response.data;
  },
  
  validateToken: async () => {
    const response = await api.get('/api/user/info');
    return response.data;
  },
};

// Product API
export const productAPI = {
  list: async () => {
    const response = await api.get('/api/product/list');
    return response.data;
  },
  
  add: async (formData) => {
    const response = await api.post('/api/product/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  remove: async (id) => {
    const response = await api.post('/api/product/remove', { id });
    return response.data;
  },
  
  update: async (formData) => {
    const response = await api.post('/api/product/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.post('/api/product/single', { productId: id });
    return response.data;
  },
};

// Order API
export const orderAPI = {
  list: async () => {
    const response = await api.post('/api/order/list');
    return response.data;
  },
  
  updateStatus: async (orderId, status) => {
    const response = await api.post('/api/order/status', { orderId, status });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/api/order/stats');
    return response.data;
  },
};

// Coupon API
export const couponAPI = {
  list: async () => {
    const response = await api.post('/api/coupons/list');
    return response.data;
  },
  
  add: async (couponData) => {
    const response = await api.post('/api/coupons/add', couponData);
    return response.data;
  },
  
  remove: async (id) => {
    const response = await api.post('/api/coupons/remove', { id });
    return response.data;
  },
};

// Carousel API
export const carouselAPI = {
  list: async () => {
    const response = await api.post('/api/carousel/list');
    return response.data;
  },
  
  add: async (formData) => {
    const response = await api.post('/api/carousel/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  remove: async (id) => {
    const response = await api.post('/api/carousel/remove', { id });
    return response.data;
  },
};

export default api; 