import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user data exists in localStorage on app initialization
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                console.log('✅ User restored from localStorage:', {
                    id: parsedUser._id,
                    email: parsedUser.email,
                    name: parsedUser.name
                });
            } catch (error) {
                console.error('❌ Error parsing user data from localStorage:', error);
                localStorage.removeItem('user');
            }
        } else {
            console.log('ℹ️ No user data found in localStorage');
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User logged in:', {
            id: userData._id,
            email: userData.email,
            name: userData.name
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        console.log('✅ User logged out');
        navigate('/login');
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export default AuthContext; 