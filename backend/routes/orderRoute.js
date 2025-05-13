import express from 'express'
import {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe, verifyRazorpay, processCardPayment, cancelOrder} from '../controllers/orderController.js'
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
orderRouter.post('/verify-stripe',verifyToken,verifyStripe)
orderRouter.post('/verify-razorpay',verifyToken,verifyRazorpay)
orderRouter.post('/process-card',verifyToken,processCardPayment)
orderRouter.post('/cancel',verifyToken,cancelOrder)

export default orderRouter