import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

const CartDebug = () => {
  const { cartItems, products, token, user, getCartCount, getCartAmount } = useContext(ShopContext);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const cartData = [];
  for (const itemId in cartItems) {
    for (const size in cartItems[itemId]) {
      if (cartItems[itemId][size] > 0) {
        const product = products.find(p => p._id === itemId);
        cartData.push({
          itemId,
          size,
          quantity: cartItems[itemId][size],
          product: product || { name: 'Product not found' }
        });
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Cart Debug</h3>
      <div className="space-y-1">
        <div>Token: {token ? 'Yes' : 'No'}</div>
        <div>User ID: {user?._id || 'None'}</div>
        <div>Cart Count: {getCartCount()}</div>
        <div>Cart Amount: ₹{getCartAmount()}</div>
        <div>Items: {cartData.length}</div>
        {cartData.map((item, index) => (
          <div key={index} className="text-yellow-300">
            {item.product.name} - {item.size} x{item.quantity}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartDebug; 