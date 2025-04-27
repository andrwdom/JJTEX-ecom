import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import { useLocation, useNavigate } from 'react-router-dom'

const SearchBar = () => {
  const { setSearch, setShowSearch } = useContext(ShopContext)
  const [localSearch, setLocalSearch] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (localSearch.trim()) {
      setSearch(localSearch)
      setShowSearch(true)
      navigate('/collection')
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setLocalSearch(value)
    setSearch(value)
    setShowSearch(value.trim() !== '')
    
    if (value.trim() && location.pathname !== '/collection') {
      navigate('/collection')
    }
  }

  const handleClear = () => {
    setLocalSearch('')
    setSearch('')
    setShowSearch(false)
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className={`flex items-center bg-white rounded-full border shadow-sm transition-all duration-300 ${
        isFocused ? 'ring-1 ring-[#FF6EBB] border-[#FF6EBB]' : 'border-gray-300'
      }`}>
        <button type="submit" className="pl-4">
          <img src={assets.search_icon} className="w-4 h-4 opacity-50" alt="Search" />
        </button>
        <input
          type="text"
          value={localSearch}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for Products..."
          className="w-full px-3 py-2 rounded-full outline-none text-sm placeholder-gray-400"
        />
        {localSearch && (
          <button 
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  )
}

export default SearchBar
