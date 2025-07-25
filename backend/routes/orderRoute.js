import express from 'express'
import {placeOrder, placeOrderPhonePe, allOrders, userOrders, updateStatus, verifyPhonePe, cancelOrder, checkPhonePeStatus, refundPhonePe} from '../controllers/orderController.js'
import adminAuth  from '../middleware/adminAuth.js'
import { verifyToken } from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list',adminAuth,allOrders)
orderRouter.post('/status',adminAuth,updateStatus)

// User Features
orderRouter.post('/userorders',verifyToken,userOrders)
orderRouter.post('/place',verifyToken,placeOrder)
orderRouter.post('/place-phonepe',verifyToken,placeOrderPhonePe)
orderRouter.post('/verify-phonepe',verifyPhonePe)
orderRouter.get('/status-phonepe/:transactionId', checkPhonePeStatus)
orderRouter.post('/refund-callback-phonepe', (req, res) => {
    console.log("PhonePe Refund Callback:", req.body);
    res.status(200).send();
});
orderRouter.post('/cancel',verifyToken,cancelOrder)

// Add PhonePe route if not already present
orderRouter.post('/phonepe', authUser, placeOrderPhonePe)
orderRouter.post('/verifyPhonePe', authUser, verifyPhonePe)

export default orderRouter
