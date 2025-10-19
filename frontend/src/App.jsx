import React from 'react'
import { Routes, Route } from 'react-router-dom'
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
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Verify from './pages/Verify'
import PageTransition from './components/PageTransition'
import ForgotPassword from './pages/ForgotPassword'
import LoadingScreen from './components/LoadingScreen'
import { LoadingProvider } from './context/LoadingContext'
import WithClickSpark from './components/WithClickSpark'
import { AuthProvider } from './context/AuthContext'
import ShopContextProvider from './context/ShopContext'
import AuthCheck from './components/AuthCheck'

// Import policy pages
import TermsAndConditions from './pages/policies/TermsAndConditions'
import PolicyPrivacy from './pages/policies/PolicyPrivacy'
import RefundPolicy from './pages/policies/RefundPolicy'
import ReturnPolicy from './pages/policies/ReturnPolicy'
import ShippingPolicy from './pages/policies/ShippingPolicy'

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.jjtextiles.com';

const App = () => {
  return (
    <AuthProvider>
      <ShopContextProvider>
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
                    
                    {/* Policy Routes */}
                    <Route path='/policies/terms-and-conditions' element={<TermsAndConditions />} />
                    <Route path='/policies/privacy-policy' element={<PolicyPrivacy />} />
                    <Route path='/policies/refund-policy' element={<RefundPolicy />} />
                    <Route path='/policies/return-policy' element={<ReturnPolicy />} />
                    <Route path='/policies/shipping-policy' element={<ShippingPolicy />} />
                  </Routes>
                </PageTransition>
                <Footer />
              </div>
            </div>
          </WithClickSpark>
        </LoadingProvider>
      </ShopContextProvider>
    </AuthProvider>
  )
}

export default App
