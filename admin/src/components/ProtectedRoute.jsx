import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const response = await authAPI.validateToken();
        
        if (response.success) {
          setIsValid(true);
        } else {
          localStorage.removeItem('token');
          setIsValid(false);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
          setIsValid(false);
        } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          // For network errors, assume token is valid for now
          setIsValid(true);
        } else {
          localStorage.removeItem('token');
          setIsValid(false);
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-400"></div>
      </div>
    );
  }
  
  if (!token || !isValid) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute; 