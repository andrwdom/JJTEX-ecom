import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';

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
      case 'cancelled':
        return 'bg-red-500';
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
  const { backendUrl, token, currency, setToken, navigate } = useContext(ShopContext);
  const [orderData, setorderData] = useState([]);
  const [showContact, setShowContact] = useState(false);
  const [user, setUser] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const loadOrderData = async () => {
    try {
      if (!token) return null;
      const response = await axios.post(backendUrl + '/api/order/userorders', { userId: JSON.parse(atob(token.split('.')[1])).id }, { headers: { token } });
      if (response.data.success) {
        let allOrdersItem = [];
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item['status'] = order.status;
            item['payment'] = order.payment;
            item['paymentMethod'] = order.paymentMethod;
            item['date'] = order.date;
            item['orderId'] = order._id;
            allOrdersItem.push(item);
          });
        });
        setorderData(allOrdersItem.reverse());
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await axios.get(backendUrl + '/api/user/info', { headers: { token } });
      console.log('User info response:', res.data);
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
      toast.error('Failed to load user info');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        backendUrl + '/api/user/change-password',
        { oldPassword: passwords.old, newPassword: passwords.new },
        { headers: { token } }
      );
      if (res.data.success) {
        setSuccess('Password changed successfully');
        setPasswords({ old: '', new: '', confirm: '' });
        setShowChangePassword(false);
      } else {
        setError(res.data.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const response = await axios.post(
        backendUrl + '/api/order/cancel',
        { orderId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Order cancelled successfully');
        loadOrderData(); // Refresh orders
      } else {
        toast.error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const canCancelOrder = (status) => {
    return ['Order Placed', 'Packing'].includes(status) && !cancellingOrderId;
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadOrderData();
    fetchUserInfo();
  }, [token]);

  return (
    <div className='max-w-[1280px] mx-auto px-4'>
      <div className='border-t pt-8 md:pt-16'>
        <div className='mb-8'>
          <Title text1={'MY'} text2={'PROFILE'} />
        </div>
        <div className='bg-white rounded-lg shadow-sm border p-6 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
          {user ? (
            <>
              <div>
                <div className='mb-2 flex items-center gap-2'>
                  <span className='font-semibold text-gray-700'>Username:</span>
                  <span className='text-gray-600'>{user.name}</span>
                </div>
                <div className='mb-2 flex items-center gap-2'>
                  <span className='font-semibold text-gray-700'>Email:</span>
                  <span className='text-gray-600'>{user.email}</span>
                </div>
                <button
                  className='mt-2 px-4 py-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 text-sm'
                  onClick={() => setShowChangePassword((v) => !v)}
                >
                  {showChangePassword ? 'Cancel' : 'Change Password'}
                </button>
                {showChangePassword && (
                  <form onSubmit={handleChangePassword} className='mt-4 flex flex-col gap-2'>
                    <input
                      type='password'
                      placeholder='Old Password'
                      className='px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200'
                      value={passwords.old}
                      onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
                      required
                    />
                    <input
                      type='password'
                      placeholder='New Password'
                      className='px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200'
                      value={passwords.new}
                      onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                      required
                    />
                    <input
                      type='password'
                      placeholder='Confirm New Password'
                      className='px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200'
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                    {error && <div className='text-red-500 text-xs'>{error}</div>}
                    {success && <div className='text-green-600 text-xs'>{success}</div>}
                    <button type='submit' className='bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors mt-2' disabled={loading}>
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                )}
              </div>
              <button
                className='mt-2 px-4 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm h-fit'
                onClick={() => {
                  setToken('');
                  localStorage.removeItem('token');
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <div className='text-gray-500'>Loading user info...</div>
          )}
        </div>
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
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${item.payment ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {item.payment ? 'Paid' : 'Pending'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className='flex flex-col gap-3 md:text-right'>
                    <OrderStatus status={item.status} />
                    <div className='flex flex-col gap-2'>
                      {canCancelOrder(item.status) && (
                        <button
                          onClick={() => handleCancelOrder(item.orderId)}
                          disabled={cancellingOrderId === item.orderId}
                          className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                            cancellingOrderId === item.orderId
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {cancellingOrderId === item.orderId ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    <button 
                      onClick={() => setShowContact(true)}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      Need help with this order?
                    </button>
                      </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Contact Support Modal */}
        {showContact && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg p-6 max-w-md w-full'>
              <h3 className='text-xl font-semibold mb-4'>Contact Support</h3>
              <p className='text-gray-600 mb-4'>
                Our customer support team is here to help you with any questions or concerns about your order.
              </p>
              <div className='space-y-4 mb-6'>
              <a 
                  href='tel:+919791983410'
                  className='flex items-center gap-2 text-blue-600 hover:text-blue-800'
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                +91 97919 83410
              </a>
                <a 
                  href='mailto:support@jjtex.com'
                  className='flex items-center gap-2 text-blue-600 hover:text-blue-800'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  support@jjtex.com
                </a>
              </div>
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