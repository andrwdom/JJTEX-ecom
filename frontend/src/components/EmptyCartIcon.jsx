import React from 'react';

const EmptyCartIcon = ({ className = "w-32 h-32", ...props }) => {
  return (
    <svg 
      viewBox="0 0 128 128" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Shopping Cart Body - Empty */}
      <path 
        d="M20 20h8l2 4M35 65h50l20-40H30m0 0L35 65m0 0l-12.5 25M35 65l-12.5 25m0 0h47.5a10 10 0 0010-10v-5a10 10 0 00-10-10h-47.5m0 0l12.5-25"
        stroke="#D1D5DB" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Cart Grid Pattern - Empty */}
      <path 
        d="M20 30h60l-5 10H25L20 30z" 
        fill="#D1D5DB" 
        opacity="0.3"
      />
      
      {/* Cart Wheels */}
      <circle 
        cx="30" 
        cy="90" 
        r="8" 
        fill="#D1D5DB"
      />
      <circle 
        cx="30" 
        cy="90" 
        r="3" 
        fill="white"
      />
      <circle 
        cx="90" 
        cy="90" 
        r="8" 
        fill="#D1D5DB"
      />
      <circle 
        cx="90" 
        cy="90" 
        r="3" 
        fill="white"
      />
      
      {/* Question Mark Inside Cart */}
      <circle 
        cx="60" 
        cy="50" 
        r="15" 
        fill="#F3F4F6" 
        stroke="#D1D5DB" 
        strokeWidth="2"
      />
      <path 
        d="M60 40v8M60 55v2" 
        stroke="#9CA3AF" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      <circle 
        cx="60" 
        cy="65" 
        r="1.5" 
        fill="#9CA3AF"
      />
    </svg>
  );
};

export default EmptyCartIcon; 