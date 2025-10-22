import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const LogoutButton = () => {
  const { setToken, navigate } = React.useContext(ShopContext);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear local state
      setToken('');
      localStorage.removeItem('token');
      
      toast.success('Successfully signed out');
      navigate('/');
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
