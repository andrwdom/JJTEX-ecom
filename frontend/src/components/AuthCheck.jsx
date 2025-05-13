import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

export default function AuthCheck() {
    const { token } = useContext(ShopContext);
    const navigate = useNavigate();
    const location = useLocation();
    const DELAY_SECONDS = 5;

    // List of paths that don't require authentication
    const publicPaths = ['/', '/login', '/register', '/about', '/contact', '/collection'];

    useEffect(() => {
        // Don't redirect if:
        // 1. User is authenticated (has token)
        // 2. Current path is public
        // 3. Path contains 'product' (product details pages)
        if (token || 
            publicPaths.includes(location.pathname) || 
            location.pathname.includes('product')) {
            return;
        }

        const redirectTimer = setTimeout(() => {
            navigate('/login');
        }, DELAY_SECONDS * 1000);

        return () => {
            clearTimeout(redirectTimer);
        };
    }, [token, location.pathname, navigate]);

    return null;
} 