import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { useAuth } from './AuthContext';
import { getApiEndpoint, useLegacyEndpoints } from '../config/api.config.js';
import apiService from '../services/apiService.js';

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
    const { user } = useAuth();

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
                    setToken('');
                    setCartItems({});
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
    }, [token, navigate]);

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

    const getProductsData = async () => {
        try {
            setIsLoading(true);
            console.log('🔄 Fetching products...');
            console.log('🔄 Current products state before fetch:', products, 'Type:', typeof products);
            
            // Add request timestamp for debugging
            const requestStart = Date.now();
            
            // Use new API service
            const response = await apiService.getProducts();
            const requestTime = Date.now() - requestStart;
            console.log(`📦 API Response received in ${requestTime}ms:`, response);
            
            // Handle both response formats with additional safety checks
            if (response && response.products) {
                // BackendV2 format: { products: [...], total, page, pages, limit }
                console.log('✅ Using backendV2 format, products:', response.products);
                safeSetProducts(Array.isArray(response.products) ? response.products.reverse() : []);
            } else if (response && response.success && response.data) {
                // New format: { success: true, data: [...] }
                console.log('✅ Using new format, products:', response.data);
                safeSetProducts(Array.isArray(response.data) ? response.data.reverse() : []);
            } else if (Array.isArray(response)) {
                // Direct array response
                console.log('✅ Direct array response, products:', response);
                safeSetProducts(response.reverse());
            } else {
                console.log('❌ No products found in response:', response);
                safeSetProducts([]);
            }
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            const errorInfo = apiService.handleError(error);
            
            // Handle timeout specifically with retry limit
            if (error.code === 'ECONNABORTED') {
                const retryCount = error.config?.__retryCount || 0;
                if (retryCount < 2) { // Max 2 retries
                    console.warn(`⚠️ API timeout - retrying in 3 seconds... (attempt ${retryCount + 1}/2)`);
                    error.config.__retryCount = retryCount + 1;
                    setTimeout(() => {
                        getProductsData();
                    }, 3000);
                } else {
                    console.error('❌ Max retries reached for products API');
                    toast.error('Failed to load products. Please refresh the page.');
                }
            } else {
                toast.error(errorInfo.message || 'Failed to fetch products');
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