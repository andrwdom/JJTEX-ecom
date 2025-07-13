import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { useContext } from 'react'

const confettiColors = [
  '#ff69b4', '#ffd700', '#7cf6e6', '#ffb347', '#b19cd9', '#fff', '#ff6f91', '#6ec6ff'
]

function ConfettiBurst({ show }) {
  if (!show) return null
  return (
    <div className="absolute left-0 top-0 w-full h-full pointer-events-none z-[100]" style={{overflow: 'visible'}}>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1
          }}
          animate={{
            opacity: 0,
            x: Math.cos((i / 12) * 2 * Math.PI) * 60 + (Math.random() - 0.5) * 20,
            y: Math.sin((i / 12) * 2 * Math.PI) * 60 + (Math.random() - 0.5) * 20,
            scale: 0.7 + Math.random() * 0.6
          }}
          transition={{ duration: 0.8, ease: 'ease-out' }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '60%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: confettiColors[i % confettiColors.length],
            zIndex: 100
          }}
        />
      ))}
    </div>
  )
}

const ProductCard = ({ product }) => {
  const { currency, addToCart } = useContext(ShopContext)
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleAddToCart = (e) => {
    e.preventDefault()
    addToCart(product._id)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 900)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative"
      style={{ overflow: 'visible', willChange: 'opacity, transform' }}
    >
      <Link 
        to={`/product/${product._id}`}
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-xl transition-all duration-300 relative" style={{overflow: 'visible'}}>
          {/* Confetti Burst */}
          <ConfettiBurst show={showConfetti} />
          {/* Image Container */}
          <div className="relative w-full pb-[125%] rounded-[1.5rem] bg-gray-50 mb-4" style={{overflow: 'visible'}}>
            <AnimatePresence mode="wait">
              <motion.img 
                key={product.image[0]}
                src={product.image[0]} 
                alt={product.name}
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
                loading="lazy"
                onLoad={() => setIsImageLoaded(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: isImageLoaded ? 1 : 0 }}
                exit={{ opacity: 0 }}
                style={{ willChange: 'opacity, transform' }}
              />
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToCart}
                  className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-[#ff69b4] hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-[#ff69b4] hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.bestseller && (
                <span className="bg-[#ff69b4] text-white text-xs px-3 py-1 rounded-full">
                  Best Seller
                </span>
              )}
              {product.new && (
                <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
                  New
                </span>
              )}
            </div>
          </div>
          
          {/* Product Info */}
          <div className="px-2">
            <h3 className="text-gray-800 font-medium mb-2 line-clamp-1 group-hover:text-[#ff69b4] transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-[#ff69b4] font-semibold">
                {currency}{product.price}
              </p>
              {product.oldPrice && (
                <p className="text-gray-400 text-sm line-through">
                  {currency}{product.oldPrice}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default ProductCard 