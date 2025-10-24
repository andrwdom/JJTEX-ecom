import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { ShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const GoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setToken, navigate, backendUrl } = React.useContext(ShopContext);
  const { login } = useAuth();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      // Send the token to your backend
      const response = await axios.post(`${backendUrl}/api/user/firebase-login`, {
        idToken: idToken
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        
        // Store token in ShopContext and localStorage
        setToken(token);
        localStorage.setItem('token', token);
        
        // ✅ IMPORTANT: Store complete user object (includes _id, email, name, role)
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update AuthContext with complete user data
        login(userData);
        
        console.log('✅ User authenticated successfully:', {
          userId: userData._id,
          email: userData.email,
          name: userData.name
        });
        
        toast.success('Successfully signed in with Google!');
        navigate('/');
      } else {
        toast.error(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups for this site.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setToken('');
      localStorage.removeItem('token');
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign-out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800">
      <div className="text-center">
        <p className='prata-regular text-3xl'>Welcome to JJTEX</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800 mx-auto mt-2' />
        <p className="text-sm text-gray-600 mt-4 px-4">
          Sign in with your Google account to continue
        </p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="text-xs text-gray-500 text-center mt-4 px-4">
        By continuing, you agree to our{' '}
        <a href="/policies/terms-and-conditions" className="text-blue-600 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/policies/privacy-policy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

export default GoogleAuth;
