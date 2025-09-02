import React from 'react';

const PhonePeIcon = ({ className = "w-24 h-8", ...props }) => {
  return (
    <svg 
      viewBox="0 0 96 32" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Purple Circle Background */}
      <circle 
        cx="16" 
        cy="16" 
        r="14" 
        fill="#6739B7"
      />
      
      {/* White Devanagari "पे" Character */}
      <path 
        d="M12 8h2v16h-2V8z M10 8h6v2h-6V8z M12 10c0 0 2 2 2 4s-2 4-2 4v-8z M14 14c0 0 2-2 2-4h-2v4z"
        fill="white"
      />
      
      {/* PhonePe Text */}
      <text 
        x="36" 
        y="22" 
        fontFamily="Arial, sans-serif" 
        fontSize="16" 
        fontWeight="bold" 
        fill="#2D3748"
      >
        PhonePe
      </text>
    </svg>
  );
};

export default PhonePeIcon; 