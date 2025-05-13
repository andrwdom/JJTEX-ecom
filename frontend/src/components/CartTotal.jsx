import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartTotal = ({ children }) => {
    const {currency, delivery_fee, getCartAmount, backendUrl} = useContext(ShopContext);
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isValidating, setIsValidating] = useState(false);

    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        setIsValidating(true);
        try {
            const response = await axios.post(backendUrl + '/api/coupons/validate', { code: couponCode });
            if (response.data.valid) {
                setDiscount(response.data.discountPercentage);
                toast.success(`Coupon applied! ${response.data.discountPercentage}% off`);
            } else {
                setDiscount(0);
                toast.error('Invalid coupon code');
            }
        } catch (error) {
            setDiscount(0);
            toast.error(error.response?.data?.message || 'Failed to validate coupon');
        } finally {
            setIsValidating(false);
        }
    };

    const subtotal = getCartAmount();
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount + (subtotal === 0 ? 0 : delivery_fee);

    return (
        <div className='w-full bg-white rounded-lg border p-6'>
            <div className='text-2xl mb-6'>
                <Title text1={'CART'} text2={'TOTALS'} />
            </div>

            <div className='flex flex-col gap-4'>
                <div className='flex justify-between text-gray-900 font-medium'>
                    <p>Subtotal</p>
                    <p>{currency} {subtotal}.00</p>
                </div>
                <hr />
                {/* Coupon Code Section */}
                <div className='flex flex-col gap-2'>
                    <div className='flex gap-2'>
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter coupon code"
                            className='flex-1 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded px-3 py-2 text-sm focus:border-pink-500 focus:ring-pink-500'
                            disabled={isValidating}
                        />
                        <button
                            onClick={applyCoupon}
                            disabled={isValidating}
                            className='bg-black text-white px-4 py-2 text-sm rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {isValidating ? 'Validating...' : 'Apply'}
                        </button>
                    </div>
                    {discount > 0 && (
                        <div className='flex justify-between text-green-600'>
                            <p>Discount ({discount}%)</p>
                            <p>- {currency} {discountAmount.toFixed(2)}</p>
                        </div>
                    )}
                </div>
                <hr />
                <div className='flex justify-between text-gray-900 font-medium'>
                    <p>Shipping Fee</p>
                    <p>{currency} {subtotal === 0 ? '0.00' : `${delivery_fee}.00`}</p>
                </div>
                <hr />
                <div className='flex justify-between text-gray-900 font-bold'>
                    <p>Total</p>
                    <p>{currency} {total.toFixed(2)}</p>
                </div>
                {children}
            </div>
        </div>
    );
};

export default CartTotal;
