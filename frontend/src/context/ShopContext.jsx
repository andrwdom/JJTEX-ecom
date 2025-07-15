import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { useAuth } from './AuthContext';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const currency = '₹';
    const currencySymbol = '₹';
    const currencyCode = 'INR';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
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
            await axios.post(backendUrl + '/api/cart/add', { userId: user?._id, itemId, size });
            toast.success('Added to cart successfully');
            await getUserCart(); // Refresh cart from backend
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error(error.response?.data?.message || 'Failed to add to cart');
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
            const response = await axios.get(backendUrl + '/api/product/list');
            if (response.data.success) {
                setProducts(response.data.products.reverse());
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch products');
        } finally {
            setIsLoading(false);
        }
    };

    const getUserCart = async () => {
        if (!token) return;
        
        try {
            setIsLoading(true);
            const response = await axios.post(backendUrl + '/api/cart/get', { userId: user?._id });
            if (response.data.success) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                setToken('');
                setCartItems({});
            } else {
                toast.error(error.response?.data?.message || 'Failed to fetch cart');
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
        products,
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
        isLoading
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;