import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import SearchBar from './SearchBar'
import { useLoading } from '../context/LoadingContext'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const { getCartCount, navigate, token, setToken } = useContext(ShopContext)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isLoading } = useLoading()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const handleNavigation = (path) => {
    setIsMenuOpen(false)
    navigate(path)
  }

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: isLoading ? 0 : 1,
      y: isLoading ? -20 : 0
    }
  }

  const menuVariants = {
    closed: { x: '-100%' },
    open: { x: 0 }
  }

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navVariants}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/60 backdrop-blur-lg shadow-xl' 
          : 'bg-gradient-to-r from-[#f3e5f5] via-[#ffe0f7] to-[#e0c3fc]'
      }`}
      style={{ willChange: 'background, box-shadow, filter' }}
    >
      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col gap-4">
          {/* Mobile Top Bar */}
          <div className="grid grid-cols-3 items-center pt-4 sm:hidden relative">
            {/* Left: Hamburger */}
            <div className="flex items-center">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
            </div>
            {/* Center: Logo */}
            <div className="flex justify-center">
              <Link to="/" className="flex items-center gap-2">
                <img src={assets.logo1} className='w-32' alt="JJ Textiles Logo" />
              </Link>
            </div>
            {/* Right: Icons */}
            <div className="flex items-center justify-end gap-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/cart" className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors">
                  <div className="relative">
                    <img src={assets.cart_icon} className="w-5 h-5" alt="Cart" />
                    <AnimatePresence>
                      {getCartCount() > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#ff69b4] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md font-bold z-10"
                        >
                          {getCartCount()}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </Link>
              </motion.div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => token ? navigate('/orders') : navigate('/login')}
                className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors relative"
              >
                <img src={assets.profile_icon} className="w-5 h-5" alt="Profile" />
              </motion.button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between gap-4 pt-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex flex-col items-start"
            >
              <Link to="/" className="flex items-center gap-2 mb-2 group">
                <div className="flex items-center gap-2">
                  <motion.img 
                    src={assets.logo1} 
                    className='w-32 drop-shadow-lg group-hover:scale-105 group-active:scale-95 transition-transform duration-200' 
                    alt="JJ Textiles Logo"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ willChange: 'transform' }}
                  />
                </div>
              </Link>
              <p className="text-gray-500 text-sm">
                Explore Our <span className="font-semibold text-black">New</span> Collection
              </p>
            </motion.div>

            <div className="flex-1 max-w-xl">
              <SearchBar />
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/cart" className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors">
                  <div className="relative">
                    <motion.img 
                      src={assets.cart_icon} 
                      className="w-5 h-5 group-hover:scale-110 group-active:scale-95 transition-transform duration-200" 
                      alt="Cart"
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.96 }}
                      style={{ willChange: 'transform' }}
                    />
                    <AnimatePresence>
                      {getCartCount() > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#ff69b4] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md font-bold z-10"
                        >
                          {getCartCount()}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </Link>
              </motion.div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => token ? navigate('/orders') : navigate('/login')}
                className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors relative"
              >
                <motion.img 
                  src={assets.profile_icon} 
                  className="w-5 h-5 group-hover:scale-110 group-active:scale-95 transition-transform duration-200" 
                  alt="Profile"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ willChange: 'transform' }}
                />
              </motion.button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="sm:hidden">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex justify-center">
            <ul className="flex gap-8">
              {['HOME', 'COLLECTION', 'ABOUT', 'CONTACT'].map((item) => (
                <li key={item}>
                  <NavLink 
                    to={item === 'HOME' ? '/' : `/${item.toLowerCase()}`}
                    className={({ isActive }) => 
                      `relative text-gray-700 hover:text-primary-500 pb-2 font-medium transition-colors duration-300 ${
                        isActive 
                          ? 'text-primary-500 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary-500 after:transform after:scale-x-100 after:transition-transform after:duration-300 after:rounded-full' 
                          : 'after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary-500 after:transform after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:rounded-full'
                      }`
                    }
                  >
                    <span className="relative z-10">{item}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[101] transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                  style={{ willChange: 'opacity, filter' }}
                />
                {/* Menu */}
                <motion.div
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={menuVariants}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="fixed top-0 left-0 h-[100vh] w-[80%] max-w-sm bg-white z-[102] shadow-xl flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b bg-[#f3e5f5]">
                      <div className="flex items-center gap-2">
                        <img src={assets.logo1} className="w-32" alt="JJ Textiles Logo" />
                      </div>
                      <button 
                        onClick={() => setIsMenuOpen(false)}
                      className="p-2 hover:bg-purple-300/20 rounded-lg text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  <div className="flex-1 overflow-y-auto bg-white">
                      <nav className="p-4">
                        <ul className="space-y-4">
                          {['HOME', 'COLLECTION', 'ABOUT', 'CONTACT'].map((item) => (
                            <li key={item}>
                              <button
                                onClick={() => handleNavigation(item === 'HOME' ? '/' : `/${item.toLowerCase()}`)}
                              className="w-full text-left py-3 px-4 rounded-lg hover:bg-primary-50 text-gray-800 font-medium transition-colors hover:text-primary-500 text-base"
                              >
                                {item}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </nav>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
