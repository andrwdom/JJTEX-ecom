import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';

const OrderStatus = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'packed':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='flex items-center gap-2'>
      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
      <p className='text-sm md:text-base capitalize'>{status}</p>
    </div>
  );
};

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setorderData] = useState([]);
  const [showContact, setShowContact] = useState(false);

  const loadOrderData = async () => {
    try {
      if (!token) {
        return null;
      }

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
      if (response.data.success) {
        let allOrdersItem = [];
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item['status'] = order.status;
            item['payment'] = order.payment;
            item['paymentMethod'] = order.paymentMethod;
            item['date'] = order.date;
            allOrdersItem.push(item);
          });
        });
        setorderData(allOrdersItem.reverse());
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  return (
    <div className='max-w-[1280px] mx-auto px-4'>
      <div className='border-t pt-8 md:pt-16'>
        <div className='text-2xl mb-8'>
          <Title text1={'MY'} text2={'ORDERS'} />
        </div>

        {orderData.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-gray-600 mb-4'>No orders found.</p>
            <p className='text-sm text-gray-500'>
              Need help? Contact our support:
              <a href="tel:+919791983410" className='text-blue-600 hover:text-blue-800 ml-2'>
                +91 97919 83410
              </a>
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {orderData.map((item, index) => (
              <div key={index} className='bg-white rounded-lg shadow-sm border p-4 md:p-6'>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                  <div className='flex items-start gap-6'>
                    <img 
                      className='w-20 h-20 object-cover rounded-md' 
                      src={item.image[0]} 
                      alt={item.name} 
                    />
                    <div className='space-y-2'>
                      <h3 className='font-medium text-lg'>{item.name}</h3>
                      <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                        <p>{currency}{item.price}</p>
                        <p>Quantity: {item.quantity}</p>
                        <p>Size: {item.size}</p>
                      </div>
                      <p className='text-sm text-gray-500'>
                        Ordered on: {new Date(item.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className='text-sm text-gray-500'>
                        Payment Method: <span className='capitalize'>{item.paymentMethod}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className='flex flex-col gap-3 md:text-right'>
                    <OrderStatus status={item.status} />
                    <button 
                      onClick={() => setShowContact(true)}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      Need help with this order?
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Information Modal */}
        {showContact && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg p-6 max-w-md w-full'>
              <h3 className='text-xl font-semibold mb-4'>Contact Support</h3>
              <p className='text-gray-600 mb-4'>
                For any queries regarding your order, please contact our support team:
              </p>
              <a 
                href="tel:+919791983410"
                className='text-xl font-semibold text-blue-600 hover:text-blue-800 block mb-6'
              >
                +91 97919 83410
              </a>
              <div className='text-sm text-gray-500 mb-6'>
                <p>Our support team is available:</p>
                <p>Monday to Saturday: 9:00 AM - 6:00 PM</p>
              </div>
              <button
                onClick={() => setShowContact(false)}
                className='w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;