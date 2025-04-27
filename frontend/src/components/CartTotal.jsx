import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import { toast } from 'react-toastify';

const CartTotal = ({ children }) => {
    const {currency, delivery_fee, getCartAmount} = useContext(ShopContext);
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);

    // Simple coupon validation - in real app, this would validate against backend
    const applyCoupon = () => {
        const coupons = {
            'WELCOME10': 10,
            'SAVE20': 20,
            'SPECIAL30': 30
        };

        if (coupons[couponCode]) {
            setDiscount(coupons[couponCode]);
            toast.success(`Coupon applied! ${coupons[couponCode]}% off`);
        } else {
            setDiscount(0);
            toast.error('Invalid coupon code');
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
                <div className='flex justify-between'>
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
                            className='flex-1 border rounded px-3 py-2 text-sm'
                        />
                        <button
                            onClick={applyCoupon}
                            className='bg-black text-white px-4 py-2 text-sm rounded hover:bg-gray-800 transition-colors'
                        >
                            Apply
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
                <div className='flex justify-between'>
                    <p>Shipping Fee</p>
                    <p>{currency} {subtotal === 0 ? '0.00' : `${delivery_fee}.00`}</p>
                </div>
                <hr />
                <div className='flex justify-between text-lg font-semibold'>
                    <p>Total</p>
                    <p>{currency} {total.toFixed(2)}</p>
                </div>

                {children}
            </div>
        </div>
    )
}

export default CartTotal
