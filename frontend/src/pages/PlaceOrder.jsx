import React, { useContext, useState, useEffect } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { CurrencyRupeeIcon, CreditCardIcon } from '@heroicons/react/24/outline'

const PlaceOrder = () => {
    const [method, setMethod] = useState('');
    const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        phone: ''
    });
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isValidating, setIsValidating] = useState(false);

    // Check for login and empty cart
    useEffect(() => {
        if (!token) {
            toast.error('Please login to place an order');
            navigate('/login');
            return;
        }

        const cartTotal = getCartAmount();
        if (cartTotal === 0) {
            toast.error('Cannot place order with empty cart');
            navigate('/cart');
            return;
        }
    }, [token, navigate]);

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setFormData(data => ({ ...data, [name]: value }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        try {
            let orderData = {
                address: formData,
                items: cartItems,
                amount: getCartAmount() + delivery_fee
            }

            switch (method) {
                case 'cod':
                    response = await axios.post(backendUrl + '/api/order/place', orderData, {headers: {token}});
                    break;
                
                case 'phonepe':
                    response = await axios.post(backendUrl + '/api/order/phonepe', orderData, {headers: {token}});
                    if (response.data.success) {
                        window.location.href = response.data.payment_url;
                    }
                    break;
                
                default:
                    break;
            }

            if (response.data.success) {
                setCartItems({});
                navigate('/orders');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }

    const applyCoupon = async () => {
        setIsValidating(true);
        try {
            const response = await axios.post(backendUrl + '/api/coupons/validate', { code: couponCode }, { headers: { token } });
            if (response.data.valid) {
                setDiscount(response.data.discountPercentage);
                toast.success('Coupon applied successfully!');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to apply coupon');
        } finally {
            setIsValidating(false);
        }
    }

    // If not logged in or cart is empty, don't render the form
    if (!token || getCartAmount() === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="px-2 sm:px-5 max-w-[1280px] mx-auto pb-32">
                {/* Back to Cart for mobile */}
                <div className="sm:hidden pt-4 pb-2">
                    <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-700 hover:text-black py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Cart
                    </button>
                </div>

                <div className="text-2xl font-bold mt-5 mb-6 text-gray-800">
                    <Title title={'Checkout'} />
                </div>

                <form id="place-order-form" onSubmit={onSubmitHandler} className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-5">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6"
                    >
                        {/* Contact Info */}
                        <div className="border border-gray-200 rounded-xl p-5 space-y-3 bg-white shadow-sm">
                            <p className="text-lg sm:text-xl font-bold mb-2 text-gray-800">Contact Info</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input required type="text" name='firstName' value={formData.firstName} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="First Name" />
                                <input required type="text" name='lastName' value={formData.lastName} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="Last Name" />
            </div>
                            <input required type="email" name='email' value={formData.email} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base w-full text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="Email" />
                            <input required type="tel" name='phone' value={formData.phone} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base w-full text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="Phone Number" />
                        </div>

                        {/* Shipping Address */}
                        <div className="border border-gray-200 rounded-xl p-5 space-y-3 bg-white shadow-sm">
                            <p className="text-lg sm:text-xl font-bold mb-2 text-gray-800">Shipping Address</p>
                            <input required type="text" name='street' value={formData.street} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base w-full text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="Street Address" />
                            <input required type="text" name='city' value={formData.city} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base w-full text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="City" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input required type="text" name='state' value={formData.state} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="State" />
                                <input required type="text" name='zipcode' value={formData.zipcode} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="ZIP Code" />
                    </div>
                            <input required type="text" name='country' value={formData.country} onChange={onChangeHandler} className="bg-white rounded-lg px-4 py-3 text-base w-full text-gray-900 placeholder-gray-500 border-gray-300 focus:border-pink-500 focus:ring-pink-500" placeholder="Country" />
                        </div>

                        {/* Payment Method */}
                        <div className="border border-gray-200 rounded-xl p-5 space-y-3 bg-white shadow-sm">
                            <p className="text-lg sm:text-xl font-bold mb-2 text-gray-800">Payment Method</p>
                            <div className='flex gap-3 flex-col lg:flex-row'>
                                <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                                    <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
                                    <img className='h-5 mx-4' src={assets.cod_icon} alt="" />
                                    <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
                                </div>
                                
                                <div onClick={() => setMethod('phonepe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                                    <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'phonepe' ? 'bg-green-400' : ''}`}></p>
                                    <img className='h-5 mx-4' src={assets.phonepe_logo} alt="" />
                                    <p className='text-gray-500 text-sm font-medium mx-4'>PHONEPE</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Order Summary (desktop) */}
                    <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
                    <CartTotal>
                            <button type='submit' className='w-full bg-[#ff69b4] text-white py-3 rounded-lg hover:bg-pink-600 transition-colors mt-4'>
                            Place Order
                        </button>
                    </CartTotal>
                </div>
            </form>

                {/* Sticky Order Summary (mobile) */}
                <AnimatePresence>
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg lg:hidden"
                    >
                        <div className="px-4 py-3 border-b border-gray-200">
                            {/* Coupon Code Section */}
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Enter coupon code"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    onClick={applyCoupon}
                                    disabled={isValidating}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {isValidating ? 'Applying...' : 'Apply'}
                                </button>
                            </div>
                            {/* Price Details */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Subtotal:</span>
                                    <span className="text-gray-900">₹{getCartAmount()}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({discount}%):</span>
                                        <span>-₹{(getCartAmount() * discount / 100).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Shipping Fee:</span>
                                    <span className="text-gray-900">₹{delivery_fee}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="font-medium text-gray-900">Total:</span>
                                    <span className="font-semibold text-lg text-gray-900">₹{getCartAmount() - (getCartAmount() * discount / 100) + delivery_fee}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <button
                                type="submit"
                                form="place-order-form"
                                className="w-full bg-[#ff69b4] text-white rounded-full py-2.5 font-medium hover:bg-pink-600 transition-colors"
                            >
                                Place Order
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default PlaceOrder





