import React, { useContext, useState, useEffect } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {
    const [method, setMethod] = useState('cod');
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

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Order Payment',
            description: 'Order Payment',
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(backendUrl + '/api/order/verifyRazorpay', response, { headers: { token } })
                    if (data.success) {
                        navigate('/orders')
                        setCartItems({})
                        toast.success('Payment successful!')
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message || 'Payment verification failed')
                }
            }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        // Double check login and empty cart before submission
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

        try {
            let orderItems = []

            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find((product) => product._id === items))
                        if (itemInfo) {
                            itemInfo.size = item
                            itemInfo.quantity = cartItems[items][item]
                            orderItems.push(itemInfo)
                        }
                    }
                }
            }

            const orderData = {
                address: formData,
                items: orderItems,
                amount: getCartAmount() + delivery_fee
            }

            if (method === 'cod') {
                try {
                    const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
                    if (response.data.success) {
                        navigate('/orders')
                        setCartItems({})
                        toast.success('Order placed successfully!')
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message || 'Failed to place order')
                }
            }
            else if (method === 'razorpay') {
                try {
                    const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, { headers: { token } })
                    if (responseRazorpay.data.success) {
                        initPay(responseRazorpay.data.order)
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message || 'Failed to initialize payment')
                }
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message || 'Something went wrong')
        }
    }

    // If not logged in or cart is empty, don't render the form
    if (!token || getCartAmount() === 0) {
        return null;
    }

    return (
        <div className='px-5 max-w-[1280px] mx-auto mb-10'>
            <div className='text-2xl font-bold my-5'>
                <Title title={'Place Order'} />
            </div>
            <form onSubmit={onSubmitHandler} className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                <div className='space-y-5'>
                    <div className='border rounded-xl p-5 space-y-3'>
                        <p className='text-xl font-bold'>Contact Info</p>
                        <div className='grid grid-cols-2 gap-5'>
                            <input required type="text" name='firstName' value={formData.firstName} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2' placeholder='First Name' />
                            <input required type="text" name='lastName' value={formData.lastName} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2' placeholder='Last Name' />
                        </div>
                        <input required type="email" name='email' value={formData.email} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2 w-full' placeholder='Email' />
                        <input required type="tel" name='phone' value={formData.phone} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2 w-full' placeholder='Phone Number' />
                    </div>
                    <div className='border rounded-xl p-5 space-y-3'>
                        <p className='text-xl font-bold'>Shipping Address</p>
                        <input required type="text" name='street' value={formData.street} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2 w-full' placeholder='Street Address' />
                        <input required type="text" name='city' value={formData.city} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2 w-full' placeholder='City' />
                        <div className='grid grid-cols-2 gap-5'>
                            <input required type="text" name='state' value={formData.state} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2' placeholder='State' />
                            <input required type="text" name='zipcode' value={formData.zipcode} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2' placeholder='ZIP Code' />
                        </div>
                        <input required type="text" name='country' value={formData.country} onChange={onChangeHandler} className='bg-gray-100 rounded-lg px-3 py-2 w-full' placeholder='Country' />
                    </div>
                    <div className='border rounded-xl p-5 space-y-3'>
                        <p className='text-xl font-bold'>Payment Method</p>
                        <div className='space-y-2'>
                            <div onClick={() => setMethod('cod')} className={`flex gap-2 items-center border p-3 rounded-lg cursor-pointer ${method === 'cod' ? 'border-black' : ''}`}>
                                <input type="radio" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                                <img src={assets.cod} className='w-14 h-8 object-contain' alt="" />
                                <span>Cash on Delivery</span>
                            </div>
                            <div onClick={() => setMethod('razorpay')} className={`flex gap-2 items-center border p-3 rounded-lg cursor-pointer ${method === 'razorpay' ? 'border-black' : ''}`}>
                                <input type="radio" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
                                <img src={assets.razorpay} className='w-14 h-8 object-contain' alt="" />
                                <span>Razorpay</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='lg:sticky lg:top-0 h-fit'>
                    <CartTotal>
                        <button type='submit' className='w-full bg-pink-400 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors mt-4'>
                            Place Order
                        </button>
                    </CartTotal>
                </div>
            </form>
        </div>
    )
}

export default PlaceOrder
