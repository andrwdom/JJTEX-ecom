import React, { useEffect, useState } from 'react'
import { orderAPI } from '../services/api'
import { toast } from 'react-toastify'

const Orders = ({ token, setToken }) => {
  const [orderList, setOrderList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await orderAPI.list()
      
      if (response.success) {
        setOrderList(response.orders.reverse())
      } else {
        toast.error(response.message || 'Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await orderAPI.updateStatus(orderId, status)
      
      if (response.success) {
        toast.success(response.message || 'Order status updated successfully')
        await fetchOrders() // Refresh the list
      } else {
        toast.error(response.message || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(error.response?.data?.message || 'Failed to update order status')
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-16 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h3 className='text-2xl font-bold mb-6'>Orders</h3>
      
      {orderList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className='space-y-4'>
          {orderList.map((order, index) => (
            <div key={index} className='bg-white p-4 rounded-lg shadow border'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-4 mb-2'>
                    <p className='font-semibold'>Order #{order._id}</p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.payment ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment ? 'Paid' : 'Pending Payment'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'Order Placed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p><strong>Amount:</strong> ₹{order.amount}</p>
                      <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                      <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p><strong>Customer:</strong> {order.address.name}</p>
                      <p><strong>Phone:</strong> {order.address.phone}</p>
                      <p><strong>Address:</strong> {order.address.street}, {order.address.city}</p>
                    </div>
                  </div>
                  
                  <div className='mt-3'>
                    <p className='font-semibold mb-2'>Items:</p>
                    <div className='space-y-1'>
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className='flex items-center gap-2 text-sm'>
                          <img src={item.image} alt={item.name} className='w-8 h-8 object-cover rounded' />
                          <span>{item.name}</span>
                          <span className='text-gray-500'>x{item.quantity}</span>
                          <span className='font-medium'>₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className='flex flex-col gap-2'>
                  <select 
                    value={order.status} 
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className='border border-gray-300 rounded px-3 py-2 text-sm'
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders