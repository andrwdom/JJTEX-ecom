import express from 'express'
import {placeOrder, placeOrderPhonePe, allOrders, userOrders, updateStatus, verifyPhonePe, cancelOrder, checkPhonePeStatus, refundPhonePe, getOrderStats, verifyStripe, verifyRazorpay} from '../controllers/orderController.js'
import adminAuth  from '../middleware/adminAuth.js'
import { verifyToken } from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list',adminAuth,allOrders)
orderRouter.post('/status',adminAuth,updateStatus)
orderRouter.post('/refund-phonepe',adminAuth,refundPhonePe)
orderRouter.get('/stats',adminAuth,getOrderStats)

// User Features
orderRouter.post('/userorders',verifyToken,userOrders)
orderRouter.post('/place',verifyToken,placeOrder)
orderRouter.post('/place-phonepe',verifyToken,placeOrderPhonePe)
orderRouter.post('/verify-phonepe',verifyPhonePe)
orderRouter.post('/verifyStripe',verifyToken,verifyStripe)
orderRouter.post('/verifyRazorpay',verifyToken,verifyRazorpay)
orderRouter.get('/status-phonepe/:transactionId', checkPhonePeStatus)
orderRouter.post('/refund-callback-phonepe', (req, res) => {
    console.log("PhonePe Refund Callback:", req.body);
    res.status(200).send();
});
orderRouter.post('/cancel',verifyToken,cancelOrder)

export default orderRouter