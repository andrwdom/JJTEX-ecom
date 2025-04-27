import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import SearchBar from './SearchBar'

const Navbar = () => {
  const { getCartCount, navigate, token, setToken } = useContext(ShopContext)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavigation = (path) => {
    setIsMenuOpen(false)
    navigate(path)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#f3e5f5] shadow-sm px-4 sm:px-6 pb-6">
      <div className="flex flex-col gap-4">
        {/* Mobile Top Bar */}
        <div className="flex items-center justify-between pt-4 sm:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <Link to="/" className="flex items-center">
              <div className="flex items-center gap-2">
                <img src={assets.logo1} className='mb-5 w-32' alt="" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative p-2 hover:bg-purple-300/20 rounded-lg transition-colors">
              <img src={assets.cart_icon} className="w-5 h-5" alt="Cart" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff69b4] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button 
              onClick={() => token ? navigate('/orders') : navigate('/login')}
              className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors"
            >
              <img src={assets.profile_icon} className="w-5 h-5" alt="Login" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between gap-4 pt-3">
          <div className="flex flex-col items-start">
            <Link to="/" className="flex items-center mb-2">
              <div className="flex items-center gap-2">
              <img src={assets.logo1} className='mb- w-32' alt="" />
              </div>
            </Link>
            <p className="text-gray-600 text-sm">
              Explore Our <span className="font-semibold text-black">New</span> Collection
            </p>
          </div>

          <div className="flex-1 max-w-xl">
            <SearchBar />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="p-2 hover:bg-purple-300/20 rounded-lg transit ion-colors relative">
              <img src={assets.cart_icon} className="w-5 h-5" alt="Cart" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff69b4] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button 
              onClick={() => token ? navigate('/orders') : navigate('/login')}
              className="p-2 hover:bg-purple-300/20 rounded-lg transition-colors relative group"
            >
              <img src={assets.profile_icon} className="w-5 h-5" alt="Profile" />
              {token && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/orders');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    My Orders
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setToken('');
                      localStorage.removeItem('token');
                      navigate('/');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="sm:hidden">
          <SearchBar />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex justify-center">
          <ul className="flex gap-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `relative text-gray-700 hover:text-[#ff69b4] pb-2 font-medium ${
                  isActive ? 'text-[#ff69b4] after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ff69b4]' : ''
                }`
              }
            >
              HOME
            </NavLink>
            <NavLink 
              to="/collection" 
              className={({ isActive }) => 
                `relative text-gray-700 hover:text-[#ff69b4] pb-2 font-medium ${
                  isActive ? 'text-[#ff69b4] after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ff69b4]' : ''
                }`
              }
            >
              COLLECTION
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `relative text-gray-700 hover:text-[#ff69b4] pb-2 font-medium ${
                  isActive ? 'text-[#ff69b4] after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ff69b4]' : ''
                }`
              }
            >
              ABOUT
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                `relative text-gray-700 hover:text-[#ff69b4] pb-2 font-medium ${
                  isActive ? 'text-[#ff69b4] after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ff69b4]' : ''
                }`
              }
            >
              CONTACT
            </NavLink>
          </ul>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          >
            <div 
              className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white transform transition-transform duration-300 ease-out rounded-r-[2rem] ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <Link to="/cart" className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </Link>
                </div>
                <nav>
                  <ul className="space-y-4">
                    <li>
                      <button 
                        onClick={() => handleNavigation('/')}
                        className="w-full text-left p-4 rounded-xl bg-gray-50 text-gray-800 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        HOME
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handleNavigation('/collection')}
                        className="w-full text-left p-4 rounded-xl bg-gray-50 text-gray-800 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        COLLECTION
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handleNavigation('/about')}
                        className="w-full text-left p-4 rounded-xl bg-gray-50 text-gray-800 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        ABOUT
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handleNavigation('/contact')}
                        className="w-full text-left p-4 rounded-xl bg-gray-50 text-gray-800 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        CONTACT
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
