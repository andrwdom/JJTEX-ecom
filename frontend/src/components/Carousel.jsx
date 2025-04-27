import React, { useState, useEffect } from 'react'

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const handleSlideClick = (sectionId) => {
    document.querySelector(`#${sectionId}`).scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const slides = [
    {   
      title: "Hot Sale",
      description: "Up to 50% off on selected items",
      image: "/images/banner1.png",
      sectionId: 'best-seller-section'
    },
    {
      title: "New Arrivals",
      description: "Check out our latest collection",
      image: "/images/banner2.png",
      sectionId: 'latest-collection-section'
    },
    {
      title: "Special Offers",
      description: "Limited time deals",
      image: "/images/banner3.png"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          onClick={() => slide.sectionId && handleSlideClick(slide.sectionId)}
          style={{ cursor: slide.sectionId ? 'pointer' : 'default' }}
          className={`absolute inset-0 transition-opacity duration-500 ${
            currentSlide === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30">
            <div className="absolute bottom-8 left-8 text-white">
              <h2 className="text-4xl font-bold mb-2">{slide.title}</h2>
              <p className="text-lg">{slide.description}</p>
            </div>
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentSlide(index)
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentSlide === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default Carousel 