import express from 'express';
import { getAllProducts } from '../controllers/productController.js';
import { getUserCart, addToCart, updateCart } from '../controllers/cartController.js';
import { placeOrder as createOrder } from '../controllers/orderController.js';
import { 
    placeOrder, 
    placeOrderPhonePe, 
    userOrders, 
    verifyPhonePe, 
    checkPhonePeStatus, 
    cancelOrder 
} from '../controllers/legacyOrderController.js';
import { verifyToken } from '../middleware/auth.js';

const legacyRouter = express.Router();

/**
 * LEGACY ROUTES - Backward compatibility for existing frontend
 * These routes maintain the old API format while using new backendV2 functionality
 */

// Legacy Product Routes
legacyRouter.get('/api/product/list', async (req, res) => {
  try {
    // Call getAllProducts directly - it already sends the response
    await getAllProducts(req, res);
  } catch (error) {
    console.error('Legacy product list error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products'
      });
    }
  }
});

// Legacy Cart Routes
legacyRouter.post('/api/cart/get', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Use new cart controller
    req.user = { _id: userId };
    const response = await getUserCart(req, res);
    
    // Transform to old format if needed
    if (response.data) {
      return res.json({
        success: true,
        cartData: response.data.cartData || response.data
      });
    }
  } catch (error) {
    console.error('Legacy cart get error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

legacyRouter.post('/api/cart/add', verifyToken, async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;
    if (!userId || !itemId || !size) {
      return res.status(400).json({
        success: false,
        message: 'User ID, item ID, and size are required'
      });
    }

    // Use new cart controller
    req.user = { _id: userId };
    req.body.quantity = 1; // Default quantity for legacy API
    const response = await addToCart(req, res);
    
    return res.json({
      success: true,
      message: 'Added To Cart'
    });
  } catch (error) {
    console.error('Legacy cart add error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add to cart'
    });
  }
});

legacyRouter.post('/api/cart/update', verifyToken, async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;
    if (!userId || !itemId || !size || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'User ID, item ID, size, and quantity are required'
      });
    }

    // Use new cart controller
    req.user = { _id: userId };
    const response = await updateCart(req, res);
    
    return res.json({
      success: true,
      message: 'Cart Updated'
    });
  } catch (error) {
    console.error('Legacy cart update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
});

// Legacy Order Routes
legacyRouter.post('/api/order', verifyToken, async (req, res) => {
  try {
    // Transform old order format to new format
    const { items, shippingAddress, paymentMethod } = req.body;
    
    if (!items || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Items, shipping address, and payment method are required'
      });
    }

    // Transform to new order format
    const newOrderData = {
      cartItems: items,
      shippingInfo: {
        fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        email: req.user.email,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.street,
        addressLine2: '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.zipcode,
        country: shippingAddress.country || 'India'
      },
      paymentMethod: paymentMethod,
      userId: req.user._id
    };

    req.body = newOrderData;
    const response = await createOrder(req, res);
    
    return res.json({
      success: true,
      message: 'Order created successfully',
      orderId: response.data?._id
    });
  } catch (error) {
    console.error('Legacy order creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Legacy User Routes (for authentication compatibility)
legacyRouter.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    return res.json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Legacy user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// Legacy Order Routes - Exact compatibility with old backend
legacyRouter.post('/api/order/place', verifyToken, placeOrder);
legacyRouter.post('/api/order/phonepe', verifyToken, placeOrderPhonePe);
legacyRouter.post('/api/order/verify-phonepe', verifyPhonePe);
legacyRouter.get('/api/order/status-phonepe/:transactionId', checkPhonePeStatus);
legacyRouter.post('/api/order/cancel', verifyToken, cancelOrder);

// Legacy Orders Route
legacyRouter.get('/api/orders/user', verifyToken, async (req, res) => {
  try {
    // Use new order controller
    const response = await userOrders(req, res);
    
    return res.json({
      success: true,
      data: response.data?.data || response.data,
      total: response.data?.total || 0,
      page: response.data?.page || 1,
      totalPages: response.data?.totalPages || 1
    });
  } catch (error) {
    console.error('Legacy orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

export default legacyRouter;
