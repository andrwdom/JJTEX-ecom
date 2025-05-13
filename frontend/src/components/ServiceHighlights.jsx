import React from 'react';
import SpotlightCard from './SpotlightCard';

const services = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.84 6.72 2.25M21 3v6h-6"/>
      </svg>
    ),
    title: 'Easy Exchange Policy',
    description: 'We offer hassle free exchange policy'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    title: '7 Days Return Policy',
    description: 'We provide 7 days free return policy'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
    title: 'Best customer support',
    description: 'we provide 24/7 customer support'
  }
];

const ServiceHighlights = () => {
  return (
    <div className="w-full py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <SpotlightCard 
              key={index}
              className="group flex flex-col items-center text-center p-8 bg-white hover:bg-gray-50 transition-colors"
              spotlightColor="rgba(255, 105, 180, 0.15)" // Pink color with low opacity
            >
              <div className="mb-4 text-[#ff69b4] group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {service.title}
              </h3>
              <p className="text-gray-800">
                {service.description}
              </p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceHighlights; 