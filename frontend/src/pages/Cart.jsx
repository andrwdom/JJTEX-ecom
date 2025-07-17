import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="border-t pt-8 bg-white min-h-screen">
      <div className="text-2xl mb-3">
        <Title text1={'YOUR'} text2={'CART'} />
      </div>
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {cartData.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <img src={assets.empty_cart} alt="Empty Cart" className="w-40 mb-6" />
              <p className="text-lg text-gray-700 mb-4">Your cart is empty</p>
              <button
                onClick={() => navigate('/collection')}
                className="bg-pink-400 text-white px-6 py-2 rounded-full font-semibold hover:bg-pink-600 transition-colors"
              >
                Shop Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {cartData.map((item, index) => {
          const productData = products.find((product) => product._id === item._id);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gray-50 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-6"
            >
              <img className="w-24 h-24 object-cover rounded-xl" src={productData.image[0]} alt="" />
              <div className="flex-1 flex flex-col items-start gap-2">
                <p className="text-base font-medium line-clamp-1">{productData.name}</p>
                <div className="flex items-center gap-3">
                  <span className="text-pink-500 font-semibold">{currency}{productData.price}</span>
                  <span className="px-3 py-1 rounded-full bg-white border text-xs font-medium">{item.size}</span>
                </div>
                {/* Quantity Stepper */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item._id, item.size, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-xl font-bold hover:bg-pink-100"
                  >-</button>
                  <input
                    value={item.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) updateQuantity(item._id, item.size, val);
                    }}
                    className="w-10 text-center border rounded-md py-1"
                    type="number"
                    min={1}
                  />
                  <button
                    onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-xl font-bold hover:bg-pink-100"
                  >+</button>
                </div>
              </div>
              <button
                onClick={() => updateQuantity(item._id, item.size, 0)}
                className="ml-auto sm:ml-0 text-gray-600 hover:text-pink-500 transition-colors"
                title="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )
        })}
      </div>
      {/* Desktop CartTotal and Checkout */}
      <div className="hidden sm:flex justify-end my-20">
        <div className="w-full sm:w-[450px]">
          <CartTotal />
          <div className="w-full text-end">
            <button onClick={() => navigate('/place-order')} className="bg-pink-400 rounded-full text-white text-sm my-8 px-8 py-3 hover:bg-pink-600">PROCEED TO CHECKOUT</button>
          </div>
        </div>
      </div>
      {/* Sticky Checkout Bar (mobile) */}
      <AnimatePresence>
        {cartData.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg flex sm:hidden items-center justify-between px-4 py-3"
          >
            <span className="font-semibold text-lg">{currency}{total}</span>
            <button
              onClick={() => navigate('/place-order')}
              className="bg-pink-400 rounded-full text-white text-base font-semibold px-6 py-2 ml-4 hover:bg-pink-600 transition-colors"
            >
              Checkout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Cart
