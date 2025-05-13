import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Collection from './pages/Collection'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from './pages/Verify'
import PageTransition from './components/PageTransition'
import ForgotPassword from './pages/ForgotPassword'
import LoadingScreen from './components/LoadingScreen'
import { LoadingProvider } from './context/LoadingContext'
import WithClickSpark from './components/WithClickSpark'
import { AuthProvider } from './context/AuthContext'
import AuthCheck from './components/AuthCheck'

export const backendUrl = import.meta.env.VITE_BACKEND_URL;

const App = () => {
  return (
    <AuthProvider>
      <LoadingProvider>
        <WithClickSpark
          sparkColor="#FF69B4"
          sparkSize={12}
          sparkRadius={20}
          sparkCount={10}
          duration={500}
          easing="ease-out"
          extraScale={1.2}
        >
          <div className='min-h-screen bg-white'>
            <LoadingScreen />
            <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] pt-[160px] sm:pt-[180px]'>
              <ToastContainer />
              <Navbar />
              <AuthCheck />
              <PageTransition>
                <Routes>
                  <Route path='/' element={<Home />} />
                  <Route path='/collection' element={<Collection />} />
                  <Route path='/about' element={<About />} />
                  <Route path='/contact' element={<Contact />} />
                  <Route path='/product/:productId' element={<Product />} />
                  <Route path='/cart' element={<Cart />} />
                  <Route path='/login' element={<Login />} />
                  <Route path='/forgot-password' element={<ForgotPassword />} />
                  <Route path='/place-order' element={<PlaceOrder />} />
                  <Route path='/orders' element={<Orders />} />
                  <Route path='/verify' element={<Verify />} />
                </Routes>
              </PageTransition>
              <Footer />
            </div>
          </div>
        </WithClickSpark>
      </LoadingProvider>
    </AuthProvider>
  )
}

export default App
