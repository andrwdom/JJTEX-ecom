import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { ShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LogoutButton = () => {
  const { setToken } = React.useContext(ShopContext);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken('');
      
      // Clear user from AuthContext (this also navigates to /login)
      logout();
      
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-gray-700 hover:text-gray-900 transition-colors"
    >
      Sign Out
    </button>
  );
};

export default LogoutButton;
