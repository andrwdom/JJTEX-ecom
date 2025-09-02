import React from 'react'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import {toast} from 'react-toastify'
import axios from 'axios'

const Verify = () => {

    const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext)
    const [searchParams, setSearchParams] = useSearchParams()
    
    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')
    const paymentMethod = searchParams.get('method') || 'phonepe' // Default to phonepe

    const verifyPayment = async () => {
        try {
            if (!token) {
                toast.error('Please login to verify payment')
                navigate('/login')
                return
            }

            if (!orderId) {
                toast.error('Order ID not found')
                navigate('/cart')
                return
            }

            let response
            if (paymentMethod === 'phonepe') {
                // For PhonePe, we need to check the payment status
                response = await axios.get(`${backendUrl}/api/order/status-phonepe/${orderId}`, { 
                    headers: { token } 
                })
            } else if (paymentMethod === 'razorpay') {
                // For Razorpay, we need to verify the payment
                response = await axios.post(`${backendUrl}/api/order/verifyRazorpay`, { 
                    orderId,
                    success 
                }, { 
                    headers: { token } 
                })
            } else {
                // For other payment methods (Stripe, etc.)
                response = await axios.post(`${backendUrl}/api/order/verifyStripe`, { 
                    success, 
                    orderId 
                }, { 
                    headers: { token } 
                })
            }

            if (response.data.success) {
                setCartItems({})
                toast.success('Payment verified successfully!')
                navigate('/orders')
            } else {
                toast.error('Payment verification failed')
                navigate('/cart')
            }

        } catch (error) {
            console.error('Payment verification error:', error)
            toast.error(error.response?.data?.message || 'Payment verification failed')
            navigate('/cart')
        }
    }

    useEffect(() => {
        verifyPayment()
    }, [token])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Payment</h2>
                    <p className="text-gray-600">Please wait while we verify your payment...</p>
                </div>
            </div>
        </div>
    )
}

export default Verify