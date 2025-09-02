import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import CouponManagement from './pages/CouponManagement'
import Dashboard from './pages/Dashboard'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import LoadingScreen from './components/LoadingScreen';
import CarouselManagement from './pages/CarouselManagement';
import ProtectedRoute from './components/ProtectedRoute';
import WithClickSpark from './components/WithClickSpark';

// Configure backend URL with fallback
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Fallback URLs based on environment
  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }
  return 'https://api.jjtextiles.com';
};

export const backendUrl = getBackendUrl();
export const currency = '₹'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');

  useEffect(()=>{
    localStorage.setItem('token',token)
  },[token])

  // Log backend URL for debugging
  useEffect(() => {
    console.log('Admin Panel Backend URL:', backendUrl);
  }, []);

  return (
    <WithClickSpark
      sparkColor="#FF69B4"
      sparkSize={12}
      sparkRadius={20}
      sparkCount={10}
      duration={500}
      easing="ease-out"
      extraScale={1.2}
    >
      <div className='bg-gray-50 min-h-screen'>
        <ToastContainer />
        <Toaster position="top-right" />
        <LoadingScreen />
        {token === ""
          ? <Login setToken={setToken} />
          : <>
            <Navbar setToken={setToken} />
            <hr />
            <div className='flex w-full'>
              <Sidebar />
              <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
                <Routes>
                  <Route path='/' element={
                    <ProtectedRoute>
                      <Dashboard token={token} setToken={setToken} />
                    </ProtectedRoute>
                  } />
                  <Route path='/add' element={
                    <ProtectedRoute>
                      <Add token={token} />
                    </ProtectedRoute>
                  } />
                  <Route path='/list' element={
                    <ProtectedRoute>
                      <List token={token} />
                    </ProtectedRoute>
                  } />
                  <Route path='/orders' element={
                    <ProtectedRoute>
                      <Orders token={token} setToken={setToken} />
                    </ProtectedRoute>
                  } />
                  <Route path='/coupons' element={
                    <ProtectedRoute>
                      <CouponManagement token={token} />
                    </ProtectedRoute>
                  } />
                  <Route path="/carousel" element={
                    <ProtectedRoute>
                      <CarouselManagement token={token} />
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </div>
          </>
        }
      </div>
    </WithClickSpark>
  )
}

export default App