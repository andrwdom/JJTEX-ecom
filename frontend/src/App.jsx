import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import LoadingScreen from './components/LoadingScreen'
import { LoadingProvider } from './context/LoadingContext'
import WithClickSpark from './components/WithClickSpark'
import { AuthProvider } from './context/AuthContext'
import ShopContextProvider from './context/ShopContext'
import AuthCheck from './components/AuthCheck'
import NetworkStatusIndicator from './components/NetworkStatusIndicator'
import ErrorBoundary from './components/ErrorBoundary'
import PageTransition from './components/PageTransition'

// 🚀 LAZY LOADING: Load components only when needed for faster initial load
const Home = lazy(() => import('./pages/Home'))
const Collection = lazy(() => import('./pages/Collection'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Product = lazy(() => import('./pages/Product'))
const Cart = lazy(() => import('./pages/Cart'))
const Login = lazy(() => import('./pages/Login'))
const PlaceOrder = lazy(() => import('./pages/PlaceOrder'))
const Orders = lazy(() => import('./pages/Orders'))
const Verify = lazy(() => import('./pages/Verify'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Navbar = lazy(() => import('./components/Navbar'))
const Footer = lazy(() => import('./components/Footer'))

// Lazy load policy pages
const TermsAndConditions = lazy(() => import('./pages/policies/TermsAndConditions'))
const PolicyPrivacy = lazy(() => import('./pages/policies/PolicyPrivacy'))
const RefundPolicy = lazy(() => import('./pages/policies/RefundPolicy'))
const ReturnPolicy = lazy(() => import('./pages/policies/ReturnPolicy'))
const ShippingPolicy = lazy(() => import('./pages/policies/ShippingPolicy'))

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.jjtextiles.com';

const App = () => {
  return (
    <ErrorBoundary>
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
              <NetworkStatusIndicator />
              <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] pt-[160px] sm:pt-[180px]'>
                <ToastContainer />
                <Navbar />
                <AuthCheck />
                <PageTransition>
                  <Suspense fallback={<LoadingScreen />}>
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
                  </Suspense>
                </PageTransition>
                <Footer />
              </div>
            </div>
            </WithClickSpark>
          </LoadingProvider>
        </ShopContextProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
