import React from 'react';

const ShoppingCartIcon = ({ className = "w-5 h-5", ...props }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Shopping Cart Body */}
      <path 
        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5 5m0 0h9.5a2 2 0 002-2v-1a2 2 0 00-2-2h-9.5m0 0l2.5-5"
        stroke="#FF6B35" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Cart Grid Pattern */}
      <path 
        d="M4 6h14l-1 2H5L4 6z" 
        fill="#FF6B35" 
        opacity="0.3"
      />
      
      {/* Shopping Bag Inside Cart */}
      <rect 
        x="8" 
        y="8" 
        width="4" 
        height="5" 
        rx="1" 
        fill="#FFD700" 
        stroke="#333" 
        strokeWidth="1"
      />
      
      {/* Bag Handle */}
      <path 
        d="M9 8h2" 
        stroke="#333" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Motion Lines */}
      <path 
        d="M2 4l1-1M2 5l1-1M2 6l1-1" 
        stroke="#333" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        opacity="0.7"
      />
      
      {/* Cart Wheels */}
      <circle 
        cx="6" 
        cy="18" 
        r="1.5" 
        fill="#333"
      />
      <circle 
        cx="6" 
        cy="18" 
        r="0.5" 
        fill="white"
      />
      <circle 
        cx="18" 
        cy="18" 
        r="1.5" 
        fill="#333"
      />
      <circle 
        cx="18" 
        cy="18" 
        r="0.5" 
        fill="white"
      />
    </svg>
  );
};

export default ShoppingCartIcon; 