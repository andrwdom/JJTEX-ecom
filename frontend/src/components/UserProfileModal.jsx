import React, { useEffect, useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';

const UserProfileModal = ({ isOpen, onClose }) => {
  const { token, setToken, backendUrl, navigate } = useContext(ShopContext);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      fetchUserInfo();
      fetchOrders();
    }
    // eslint-disable-next-line
  }, [isOpen, token]);

  const fetchUserInfo = async () => {
    try {
      const res = await axios.get(backendUrl + '/api/user/info', { headers: { token } });
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } });
      setOrders(res.data.orders || []);
    } catch (err) {
      setOrders([]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>
        {user ? (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold text-gray-700">Username:</span>
              <span className="text-gray-600">{user.name}</span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="text-gray-600">{user.email}</span>
            </div>
            <button
              className="mt-2 px-4 py-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 text-sm"
              onClick={() => setShowChangePassword((v) => !v)}
            >
              {showChangePassword ? 'Cancel' : 'Change Password'}
            </button>
            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="mt-4 flex flex-col gap-2">
                <input
                  type="password"
                  placeholder="Old Password"
                  className="input input-bordered"
                  value={passwords.old}
                  onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="input input-bordered"
                  value={passwords.new}
                  onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="input input-bordered"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  required
                />
                {error && <div className="text-red-500 text-xs">{error}</div>}
                {success && <div className="text-green-600 text-xs">{success}</div>}
                <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mb-6 text-gray-600">Loading user info...</div>
        )}
        <h3 className="text-lg font-semibold mb-2">Order History</h3>
        <div className="max-h-48 overflow-y-auto mb-2">
          {orders.length === 0 ? (
            <div className="text-gray-500 text-sm">No orders found.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {orders.map((order, idx) => (
                <li key={order._id || idx} className="py-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-700">Order #{order._id?.slice(-6) || idx + 1}</span>
                      <span className="ml-2 text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <button
                      className="text-xs text-primary-600 hover:underline"
                      onClick={() => navigate('/orders')}
                    >
                      View Details
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {order.items?.map((item, i) => (
                      <span key={i}>{item.name} x {item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          className="mt-4 w-full py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
          onClick={() => {
            setToken('');
            localStorage.removeItem('token');
            onClose();
            navigate('/');
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfileModal; 