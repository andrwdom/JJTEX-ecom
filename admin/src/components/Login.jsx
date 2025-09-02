import React, { useState } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.login(email, password)
      
      if (response.success) {
        setToken(response.token)
        toast.success('Login successful!')
      } else {
        toast.error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.response?.status === 401) {
        toast.error('Invalid credentials')
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.')
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.')
      } else {
        toast.error(error.response?.data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-theme-50'>
      <div className='bg-white shadow-lg rounded-lg px-8 py-6 max-w-md w-full mx-4'>
        <div className="flex justify-center mb-6">
          <img src={assets.logo1} alt="JJ Textiles Logo" className="w-32" />
        </div>
        <h1 className='text-2xl font-bold mb-6 text-theme-600 text-center'>Admin Panel</h1>
        
        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <p><strong>Backend URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:4000'}</p>
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
            <p><strong>Admin Email:</strong> jjtex001@gmail.com</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className=''>
            <p className='text-sm font-medium text-theme-700 mb-2'>Email Address</p>
            <input 
              onChange={(e) => setEmail(e.target.value)} 
              value={email} 
              className='rounded-md w-full px-3 py-2 border border-theme-200 outline-none focus:border-theme-400 focus:ring-1 focus:ring-theme-400 transition-colors' 
              type="email" 
              placeholder='your@email.com' 
              required 
              disabled={loading}
            />
          </div>
          <div className=''>
            <p className='text-sm font-medium text-theme-700 mb-2'>Password</p>
            <input 
              onChange={(e) => setPassword(e.target.value)} 
              value={password} 
              className='rounded-md w-full px-3 py-2 border border-theme-200 outline-none focus:border-theme-400 focus:ring-1 focus:ring-theme-400 transition-colors' 
              type="password" 
              placeholder='Enter your password' 
              required 
              disabled={loading}
            />
          </div>
          <button 
            className={`mt-6 w-full py-2.5 px-4 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-400 focus:ring-offset-2 ${
              loading 
                ? 'bg-theme-300 cursor-not-allowed' 
                : 'bg-theme-400 hover:bg-theme-500'
            }`}
            type="submit"
            disabled={loading}
          > 
            {loading ? 'Logging in...' : 'Login'} 
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login