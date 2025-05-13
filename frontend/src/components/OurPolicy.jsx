import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import SpotlightCard from './SpotlightCard'
import { motion, AnimatePresence } from 'framer-motion'
import WithClickSpark from './WithClickSpark'

const services = [
  {
    icon: assets.exchange_icon,
    title: 'Easy Exchange Policy',
    description: 'We offer hassle free exchange policy'
  },
  {
    icon: assets.quality_icon,
    title: '7 Days Return Policy',
    description: 'We provide 7 days free return policy'
  },
  {
    icon: assets.support_img,
    title: 'Best customer support',
    description: 'we provide 24/7 customer support'
  }
];

const OurPolicy = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-scroll for mobile carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.innerWidth < 768) { // Only auto-scroll on mobile
        setCurrentIndex((prev) => (prev + 1) % services.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) { // Swipe left
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }
    if (touchEnd - touchStart > 50) { // Swipe right
      setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
    }
  };

  return (
    <WithClickSpark className="w-full py-12">
      <div className="max-w-[1280px] mx-auto px-4">
        {/* Desktop View */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <SpotlightCard 
              key={index}
              className="group flex flex-col items-center text-center p-8 bg-[#F3E5F5] hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-500"
              spotlightColor="rgba(255, 105, 180, 0.15)"
            >
              <div className="relative mb-6 group-hover:scale-110 transition-transform duration-500">
                <img src={service.icon} className="relative w-12 h-12 object-contain" alt="" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2 group-hover:text-[#ff69b4] transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600">
                {service.description}
              </p>
            </SpotlightCard>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <SpotlightCard 
                  className="group flex flex-col items-center text-center p-8 bg-[#F3E5F5] mx-auto max-w-sm"
                  spotlightColor="rgba(255, 105, 180, 0.15)"
                >
                  <div className="relative mb-6">
                    <img 
                      src={services[currentIndex].icon} 
                      className="relative w-12 h-12 object-contain" 
                      alt="" 
                    />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2 group-hover:text-[#ff69b4] transition-colors">
                    {services[currentIndex].title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {services[currentIndex].description}
                  </p>
                </SpotlightCard>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {services.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-[#ff69b4] w-4' 
                    : 'bg-pink-200'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </WithClickSpark>
  )
}

export default OurPolicy
