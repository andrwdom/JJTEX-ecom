import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import EmptyCartIcon from '../components/EmptyCartIcon';

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item]
            })
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products])

  // Calculate total for sticky bar
  const total = cartData.reduce((acc, item) => {
    const product = products.find((p) => p._id === item._id);
    return acc + (product ? product.price * item.quantity : 0);
  }, 0);



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-3xl font-bold text-gray-900">
            <Title text1={'YOUR'} text2={'CART'} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <AnimatePresence>
              {cartData.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm"
                >
                  <EmptyCartIcon />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6 text-center">Looks like you haven't added any items to your cart yet.</p>
                  <button
                    onClick={() => navigate('/collection')}
                    className="bg-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-pink-600 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Start Shopping
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(cartData) && cartData.map((item, index) => {
                    const productData = products.find((product) => product._id === item._id);
                    
                    

                    return (
                      <motion.div
                        key={`${item._id}-${item.size}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {/* Product Image */}
                          <div className="sm:w-32 sm:h-32 w-full h-48 sm:h-auto">
                            <img 
                              className="w-full h-full object-cover" 
                              src={productData.images?.[0]} 
                              alt={productData.name}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                              }}
                            />
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {productData.name}
                                </h3>
                                <div className="flex items-center gap-4 mb-4">
                                  <span className="text-2xl font-bold text-pink-500">
                                    {currency}{productData.price}
                                  </span>
                                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                    Size: {item.size}
                                  </span>
                                </div>
                                
                                                                 {/* Quantity Controls */}
                                 <div className="flex items-center gap-3">
                                   <span className="text-sm font-medium text-gray-700">Quantity:</span>
                                   <div className="flex items-center border border-gray-300 rounded-lg">
                                     <button
                                       onClick={() => updateQuantity(item._id, item.size, Math.max(1, item.quantity - 1))}
                                       className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                     >
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                       </svg>
                                     </button>
                                     <input
                                       value={item.quantity}
                                       onChange={(e) => {
                                         const val = parseInt(e.target.value) || 1;
                                         if (val > 0) updateQuantity(item._id, item.size, val);
                                       }}
                                       className="w-16 text-center border-0 focus:ring-0 text-lg font-medium"
                                       type="number"
                                       min={1}
                                     />
                                     <button
                                       onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                                       className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                     >
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                       </svg>
                                     </button>
                                   </div>
                                 </div>
                              </div>
                              
                                                             {/* Remove Button */}
                               <button
                                 onClick={() => updateQuantity(item._id, item.size, 0)}
                                 className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Remove item"
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CartTotal>
                {cartData.length > 0 && (
                  <button 
                    onClick={() => navigate('/place-order')} 
                    className="w-full bg-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-pink-600 transition-colors shadow-lg hover:shadow-xl mt-6"
                  >
                    Proceed to Checkout
                  </button>
                )}
              </CartTotal>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Checkout Bar */}
        <AnimatePresence>
          {cartData.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg lg:hidden"
            >
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{currency}{total.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => navigate('/place-order')}
                  className="bg-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-pink-600 transition-colors shadow-lg"
                >
                  Checkout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Cart
