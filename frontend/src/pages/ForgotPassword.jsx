import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">Password Reset</h2>
          <div className="h-1 w-20 bg-blue-500 mx-auto"></div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg text-gray-700 mb-4">
              We're currently working on implementing the password reset feature to serve you better.
            </p>
            <p className="text-gray-600 mb-4">
              In the meantime, please contact our support team for immediate assistance:
            </p>
            <a 
              href="tel:+919791983410" 
              className="text-xl font-semibold text-blue-600 hover:text-blue-800 block mb-2"
            >
              +91 97919 83410
            </a>
          </div>

          <div className="flex flex-col space-y-4">
            <Link 
              to="/login" 
              className="bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Login
            </Link>
            <p className="text-sm text-gray-500">
              Remember your password? <Link to="/login" className="text-blue-600 hover:text-blue-800">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 