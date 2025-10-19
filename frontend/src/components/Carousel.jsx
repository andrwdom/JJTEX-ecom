import React, { useState, useEffect } from 'react'
import axios from 'axios'

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.jjtextiles.com'

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/carousel`)
      setBanners(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching carousel banners:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [banners])

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-lg">
      {banners.map((banner, index) => (
        <div
          key={banner._id}
          className={`absolute w-full h-full transition-opacity duration-500 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-4xl font-bold mb-4">{banner.title}</h2>
              <p className="text-xl mb-6">{banner.description}</p>
              {banner.sectionId && (
                <a
                  href={`#${banner.sectionId}`}
                  className="inline-block bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Learn More
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Previous/Next Buttons */}
      <button
        onClick={() =>
          setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
        }
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  )
}

export default Carousel 