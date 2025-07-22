import express from 'express'
import {placeOrder, placeOrderStripe, placeOrderRazorpay, placeOrderPhonePe, allOrders, userOrders, updateStatus, verifyStripe, verifyRazorpay, verifyPhonePe, processCardPayment, cancelOrder, checkPhonePeStatus, refundPhonePe} from '../controllers/orderController.js'
import adminAuth  from '../middleware/adminAuth.js'
import { verifyToken } from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list',adminAuth,allOrders)
orderRouter.post('/status',adminAuth,updateStatus)

// User Features
orderRouter.post('/userorders',verifyToken,userOrders)
orderRouter.post('/place',verifyToken,placeOrder)
orderRouter.post('/place-stripe',verifyToken,placeOrderStripe)
orderRouter.post('/place-razorpay',verifyToken,placeOrderRazorpay)
orderRouter.post('/place-phonepe',verifyToken,placeOrderPhonePe)
orderRouter.post('/verify-stripe',verifyToken,verifyStripe)
orderRouter.post('/verify-razorpay',verifyToken,verifyRazorpay)
orderRouter.post('/verify-phonepe',verifyPhonePe)
orderRouter.get('/status-phonepe/:transactionId', checkPhonePeStatus)
orderRouter.post('/refund-callback-phonepe', (req, res) => {
    console.log("PhonePe Refund Callback:", req.body);
    res.status(200).send();
});
orderRouter.post('/process-card',verifyToken,processCardPayment)
orderRouter.post('/cancel',verifyToken,cancelOrder)

export default orderRouter