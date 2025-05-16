import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Invoice = React.forwardRef(({ order }, ref) => (
  <div ref={ref} className='p-8 bg-white text-black w-[600px] mx-auto'>
    <h2 className='text-2xl font-bold mb-4'>INVOICE</h2>
    <div className='mb-2'>
      <b>Order ID:</b> {order._id}
    </div>
    <div className='mb-2'>
      <b>Date:</b> {new Date(order.date).toLocaleDateString()}
    </div>
    <div className='mb-2'>
      <b>Customer:</b> {order.address.firstName} {order.address.lastName}
    </div>
    <div className='mb-2'>
      <b>Address:</b> {order.address.street}, {order.address.city}, {order.address.state}, {order.address.country}, {order.address.zipcode}
    </div>
    <div className='mb-2'>
      <b>Phone:</b> {order.address.phone}
    </div>
    <div className='mb-4'>
      <b>Payment:</b> {order.payment ? 'Done' : 'Pending'} ({order.paymentMethod})
    </div>
    <table className='w-full mb-4 border'>
      <thead>
        <tr className='bg-gray-100'>
          <th className='p-2 border'>Item</th>
          <th className='p-2 border'>Size</th>
          <th className='p-2 border'>Qty</th>
          <th className='p-2 border'>Price</th>
        </tr>
      </thead>
      <tbody>
        {order.items.map((item, idx) => (
          <tr key={idx}>
            <td className='p-2 border'>{item.name}</td>
            <td className='p-2 border'>{item.size}</td>
            <td className='p-2 border'>{item.quantity}</td>
            <td className='p-2 border'>{currency}{item.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className='text-right font-bold'>Total: {currency}{order.amount}</div>
  </div>
));

const Orders = ({ token, setToken }) => {
  const [orders, setOrders] = useState([])
  const [printOrder, setPrintOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const printRef = useRef();
  const navigate = useNavigate();

  const handleAuthError = () => {
    setToken('');
    localStorage.removeItem('token');
    navigate('/');
  };

  const fetchAllOrders = async () => {
    if (!token) {
      handleAuthError();
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        {
          headers: {
            token: token
          }
        }
      );
      
      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleAuthError();
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch orders');
      }
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrder(orderId);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        {
          orderId,
          status: 'Cancelled'
        },
        {
          headers: {
            token: token
          }
        }
      );
      
      if (response.data.success) {
        await fetchAllOrders();
        toast.success('Order cancelled successfully');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        {
          orderId,
          status: event.target.value
        },
        {
          headers: {
            token: token
          }
        }
      );
      
      if (response.data.success) {
        await fetchAllOrders();
        toast.success('Order status updated successfully');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleAuthError();
      } else {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      }
    }
  }

  const handlePrint = (order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 100);
  };

  const canCancelOrder = (status) => {
    return ['Order Placed', 'Packing'].includes(status);
  };

  const getOrderStatusStyles = (status) => {
    switch (status) {
      case 'Cancelled':
        return 'border-red-200 bg-red-50';
      case 'Delivered':
        return 'border-green-200';
      case 'Shipped':
        return 'border-blue-200';
      default:
        return 'border-gray-200';
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Shipped':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Out for delivery':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Packing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token])

  return (
    <div className="p-6">
      <h3 className="text-2xl font-bold mb-6">Order Page</h3>
      <div>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center">No orders found</p>
        ) : (
          orders.map((order, index) => (
            <div 
              className={`grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 ${getOrderStatusStyles(order.status)} p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700 rounded-lg relative`} 
              key={index}
            >
              {order.status === 'Cancelled' && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-sm">
                  Cancelled Order
                </div>
              )}
              <img className='w-12' src={assets.parcel_icon} alt="" />
              <div>
                <div>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> </p>
                    }
                    else {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> ,</p>
                    }
                  })}
                </div>
                <p className='mt-3 mb-2 font-medium'>
                  {order.address ? `${order.address.firstName || 'N/A'} ${order.address.lastName || ''}` : 'Customer Name Not Available'}
                </p>
                <div>
                  {order.address ? (
                    <>
                      <p>{order.address.street + ","}</p>
                      <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                    </>
                  ) : (
                    <p>Address Not Available</p>
                  )}
                </div>
                <p>{order.address?.phone || 'Phone Not Available'}</p>
              </div>
              <div>
                <p className='text-sm sm:text-[15px]'>Items : {order.items.length}</p>
                <p className='mt-3'>Method : {order.paymentMethod}</p>
                <p>Payment : {order.payment ? 'Done' : 'Pending'}</p>
                <p>Date : {new Date(order.date).toLocaleDateString()}</p>
              </div>
              <p className='text-sm sm:text-[15px]'>{currency}{order.amount}</p>
              <div className="flex flex-col gap-2">
                <div className={`px-3 py-2 rounded-lg border ${getStatusBadgeStyles(order.status)} text-sm font-medium`}>
                  {order.status}
                </div>
                <select
                  onChange={(event) => statusHandler(event, order._id)}
                  value={order.status}
                  className='p-2 font-semibold border rounded'
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button
                  className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 text-xs'
                  onClick={() => handlePrint(order)}
                >
                  Print Invoice
                </button>
                {order.status === 'Cancelled' && order.cancelledBy && (
                  <div className="text-xs bg-red-100 border border-red-200 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-red-700 font-medium">
                          Cancelled by {order.cancelledBy.name}
                        </span>
                        <span className="text-red-600 opacity-75">
                          {order.cancelledBy.role === 'customer' ? 'Customer Cancellation' : 'Admin Cancellation'} • {new Date(order.cancelledBy.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {printOrder && (
        <div className='fixed inset-0 bg-white z-[9999] flex items-center justify-center print:block'>
          <Invoice ref={printRef} order={printOrder} />
        </div>
      )}
    </div>
  )
}

export default Orders