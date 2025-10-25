import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { useAuth } from './AuthContext';
import { getApiEndpoint, useLegacyEndpoints } from '../config/api.config.js';
import apiService from '../services/apiService.js';
import ultraFastApiService from '../services/ultraFastApiService.js';
import EmergencyFallbackService from '../services/emergencyFallback.js';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const currency = '₹';
    const currencySymbol = '₹';
    const currencyCode = 'INR';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.jjtextiles.com';
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    
    // Safety function to ensure products is always an array
    const safeSetProducts = (newProducts) => {
        if (Array.isArray(newProducts)) {
            setProducts(newProducts);
        } else {
            console.warn('Attempted to set products to non-array:', newProducts);
            setProducts([]);
        }
    };
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    // Emergency fallback service
    const emergencyFallback = new EmergencyFallbackService();

    // Configure axios defaults and interceptors
    useEffect(() => {
        // Set default headers
        if (token) {
            axios.defaults.headers.common['token'] = token;
        } else {
            delete axios.defaults.headers.common['token'];
        }

        // Add response interceptor for handling 401 errors
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Clear token and cart data
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken('');
                    setCartItems({});
                    
                    // Clear user from AuthContext
                    logout();
                    
                    toast.error('Session expired. Please login again.');
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [token, navigate, logout]);

    const addToCart = async (itemId, size) => {
        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        if (!token) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);

        try {
            setIsLoading(true);
            
            // Use new API service
            await apiService.addToCart(user?._id, itemId, size, 1);
            toast.success('Added to cart successfully');
            await getUserCart(); // Refresh cart from backend
        } catch (error) {
            console.error('Error adding to cart:', error);
            const errorInfo = apiService.handleError(error);
            toast.error(errorInfo.message || 'Failed to add to cart');
            // Revert cart data on error
            setCartItems(cartItems);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId, size, quantity) => {
        if (!token) {
            toast.error('Please login to update cart');
            navigate('/login');
            return;
        }

        let cartData = structuredClone(cartItems);
        const previousQuantity = cartData[itemId]?.[size] || 0;
        cartData[itemId][size] = quantity;
        setCartItems(cartData);

        try {
            setIsLoading(true);
            await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity });
        } catch (error) {
            console.error('Error updating cart:', error);
            toast.error(error.response?.data?.message || 'Failed to update cart');
            // Revert to previous quantity on error
            cartData[itemId][size] = previousQuantity;
            setCartItems(cartData);
        } finally {
            setIsLoading(false);
        }
    };

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {
                    console.error('Error calculating cart count:', error);
                }
            }
        }
        return totalCount;
    };

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo) {
                for (const item in cartItems[items]) {
                    try {
                        if (cartItems[items][item] > 0) {
                            totalAmount += itemInfo.price * cartItems[items][item];
                        }
                    } catch (error) {
                        console.error('Error calculating cart amount:', error);
                    }
                }
            }
        }
        return totalAmount;
    };

    const getProductsData = async (retryCount = 0) => {
        try {
            setIsLoading(true);
            console.log('🚀 Ultra-fast products loading...', retryCount > 0 ? `(Retry ${retryCount})` : '');
            
            // Add request timestamp for debugging
            const requestStart = Date.now();
            
            // Use ultra-fast API service for Amazon-level performance
            // Fallback to regular API if ultra-fast fails
            let response;
            try {
                response = await ultraFastApiService.getProductsSmart({
                    priority: 'speed',
                    categorySlug: 'all',
                    limit: 30
                });
            } catch (ultraFastError) {
                console.log('🔄 Ultra-fast failed, falling back to regular API...');
                try {
                    response = await apiService.getProducts();
                } catch (regularApiError) {
                    console.log('🚨 All APIs failed, using emergency fallback...');
                    emergencyFallback.showOfflineNotification();
                    response = await emergencyFallback.getProductsWithFallback();
                }
            }
            const requestTime = Date.now() - requestStart;
            console.log(`⚡ Ultra-fast response in ${requestTime}ms:`, response);
            
            // Handle both response formats with additional safety checks
            if (response && response.products) {
                // BackendV2 format: { products: [...], total, page, pages, limit }
                console.log('✅ Using backendV2 format, products:', response.products);
                const products = Array.isArray(response.products) ? response.products.reverse() : [];
                safeSetProducts(products);
                
                // Save to emergency cache for offline use
                if (products.length > 0 && !response.offline) {
                    emergencyFallback.saveProductsToCache(products);
                }
            } else if (response && response.success && response.data) {
                // New format: { success: true, data: [...] }
                console.log('✅ Using new format, products:', response.data);
                const products = Array.isArray(response.data) ? response.data.reverse() : [];
                safeSetProducts(products);
                
                // Save to emergency cache for offline use
                if (products.length > 0 && !response.offline) {
                    emergencyFallback.saveProductsToCache(products);
                }
            } else if (Array.isArray(response)) {
                // Direct array response
                console.log('✅ Direct array response, products:', response);
                const products = response.reverse();
                safeSetProducts(products);
                
                // Save to emergency cache for offline use
                if (products.length > 0) {
                    emergencyFallback.saveProductsToCache(products);
                }
            } else {
                console.log('❌ No products found in response:', response);
                safeSetProducts([]);
            }
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            const errorInfo = apiService.handleError(error);
            
            // Enhanced retry logic with exponential backoff
            const maxRetries = 3;
            const isRetryableError = (
                error.code === 'ECONNABORTED' ||
                error.code === 'ENOTFOUND' ||
                error.code === 'ECONNREFUSED' ||
                !error.response ||
                (error.response && error.response.status >= 500)
            );
            
            if (isRetryableError && retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                console.warn(`⚠️ API error - retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
                
                setTimeout(() => {
                    getProductsData(retryCount + 1);
                }, delay);
                return; // Don't set loading to false yet
            } else {
                // Show user-friendly error message
                const errorMessage = errorInfo.message || 'Failed to load products. Please check your connection and try again.';
                toast.error(errorMessage);
                
                // Set empty products array to prevent UI blocking
                safeSetProducts([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getUserCart = async () => {
        if (!token) return;
        
        try {
            setIsLoading(true);
            
            // Use new API service
            const response = await apiService.getCart(user?._id);
            
            if (response.success) {
                setCartItems(response.cartData || {});
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            const errorInfo = apiService.handleError(error);
            
            if (errorInfo.status === 401) {
                localStorage.removeItem('token');
                setToken('');
                setCartItems({});
            } else {
                toast.error(errorInfo.message || 'Failed to fetch cart');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch products on mount
    useEffect(() => {
        getProductsData();
    }, []);

    // Fetch cart when token changes
    useEffect(() => {
        if (token) {
            getUserCart();
        } else {
            setCartItems({});
        }
    }, [token]);

    const value = {
        products: Array.isArray(products) ? products : [],
        currency,
        currencySymbol,
        currencyCode,
        delivery_fee,
        search,
        setSearch,
        showSearch,
        setShowSearch,
        cartItems,
        addToCart,
        setCartItems,
        getCartCount,
        updateQuantity,
        getCartAmount,
        navigate,
        backendUrl,
        setToken,
        token,
        isLoading,
        user
    };
    
    // Debug log to track products state
    console.log('🔄 ShopContext render - products:', products, 'type:', typeof products, 'isArray:', Array.isArray(products));

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;