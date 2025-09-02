import React from 'react';

const RazorpayIcon = ({ className = "w-24 h-8", ...props }) => {
  return (
    <svg 
      viewBox="0 0 96 32" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Razorpay Logo - Blue background with white text */}
      <rect 
        x="0" 
        y="0" 
        width="96" 
        height="32" 
        rx="4" 
        fill="#0F4C81"
      />
      
      {/* Razorpay Text */}
      <text 
        x="8" 
        y="22" 
        fontFamily="Arial, sans-serif" 
        fontSize="14" 
        fontWeight="bold" 
        fill="white"
      >
        Razorpay
      </text>
      
      {/* Payment symbol */}
      <circle 
        cx="80" 
        cy="16" 
        r="6" 
        fill="white"
      />
      <path 
        d="M80 12v8M76 16h8" 
        stroke="#0F4C81" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default RazorpayIcon; 