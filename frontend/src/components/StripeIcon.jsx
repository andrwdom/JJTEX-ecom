import React from 'react';

const StripeIcon = ({ className = "w-24 h-8", ...props }) => {
  return (
    <svg 
      viewBox="0 0 96 32" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Stripe Logo - Purple gradient background */}
      <defs>
        <linearGradient id="stripeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#6772E5', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#5469D4', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      
      <rect 
        x="0" 
        y="0" 
        width="96" 
        height="32" 
        rx="4" 
        fill="url(#stripeGradient)"
      />
      
      {/* Stripe Text */}
      <text 
        x="8" 
        y="22" 
        fontFamily="Arial, sans-serif" 
        fontSize="16" 
        fontWeight="bold" 
        fill="white"
      >
        Stripe
      </text>
      
      {/* Payment card symbol */}
      <rect 
        x="70" 
        y="8" 
        width="18" 
        height="12" 
        rx="2" 
        fill="white"
      />
      <rect 
        x="72" 
        y="10" 
        width="4" 
        height="2" 
        rx="1" 
        fill="#6772E5"
      />
      <rect 
        x="78" 
        y="10" 
        width="8" 
        height="2" 
        rx="1" 
        fill="#6772E5"
      />
      <rect 
        x="72" 
        y="14" 
        width="12" 
        height="2" 
        rx="1" 
        fill="#6772E5"
      />
    </svg>
  );
};

export default StripeIcon; 