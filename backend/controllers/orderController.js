import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import sha256 from "sha256";
import axios from "axios";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from 'pg-sdk-node';
import { randomUUID } from 'crypto';

// global variables
const currency = 'inr'
const deliveryCharge = 10

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "TEST-M2265MTOB2G4J_25072";
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "OGM0ZTk2NjctZDE5OS00YzViLTkxMzYtYTEwNDQ1YmE3NDFi";

// Initialize PhonePe client with correct test credentials
const clientId = process.env.PHONEPE_CLIENT_ID || "TEST-M2265MTOB2G4J_25072";
const clientSecret = process.env.PHONEPE_CLIENT_SECRET || "OGM0ZTk2NjctZDE5OS00YzViLTkxMzYtYTEwNDQ1YmE3NDFi";
const clientVersion = 1;
const env = Env.SANDBOX; // Force sandbox environment for testing

const phonepeClient = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

// Log PhonePe client configuration
console.log('PhonePe client initialized with:', {
    clientId,
    clientSecret: clientSecret ? '***' + clientSecret.slice(-4) : 'missing',
    clientVersion,
    env: env === Env.SANDBOX ? 'SANDBOX' : 'PRODUCTION',
    merchantId: PHONEPE_MERCHANT_ID,
    saltKey: PHONEPE_SALT_KEY ? '***' + PHONEPE_SALT_KEY.slice(-4) : 'missing'
});

// Test PhonePe SDK functionality
try {
    const testBuilder = StandardCheckoutPayRequest.builder();
    console.log('PhonePe SDK test - Available builder methods:', Object.getOwnPropertyNames(testBuilder).filter(name => typeof testBuilder[name] === 'function'));
} catch (error) {
    console.error('PhonePe SDK test failed:', error.message);
}

async function checkStockAvailability(items) {
    console.log('checkStockAvailability called with items:', items.length);
    for (const item of items) {
        console.log('Checking stock for item:', { id: item._id, name: item.name, size: item.size, quantity: item.quantity });
        
        const product = await productModel.findById(item._id);
        if (!product) {
            console.error('Product not found:', item._id);
            throw new Error(`Product ${item.name} not found`);
        }
        
        const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
        if (sizeIndex === -1) {
            console.error('Size not found:', { product: product.name, size: item.size });
            throw new Error(`Size ${item.size} not found for product ${item.name}`);
        }
        
        const availableStock = product.sizes[sizeIndex].stock;
        console.log('Stock check result:', { product: product.name, size: item.size, available: availableStock, requested: item.quantity });
        
        if (availableStock < item.quantity) {
            console.error('Insufficient stock:', { product: product.name, size: item.size, available: availableStock, requested: item.quantity });
            throw new Error(`Insufficient stock for ${item.name} in size ${item.size}. Only ${availableStock} available.`);
        }
    }
    console.log('All stock availability checks passed');
}

async function updateProductStock(items) {
    console.log('updateProductStock called with items:', items.length);
    for (const item of items) {
        console.log('Updating stock for item:', { id: item._id, name: item.name, size: item.size, quantity: item.quantity });
        
        const product = await productModel.findById(item._id);
        if (!product) {
            console.error('Product not found in updateProductStock:', item._id);
            throw new Error(`Product ${item.name} not found`);
        }
        
        // Find the size object and update stock
        const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
        if (sizeIndex === -1) {
            console.error('Size not found in updateProductStock:', { product: product.name, size: item.size });
            throw new Error(`Size ${item.size} not found for product ${item.name}`);
        }
        
        const currentStock = product.sizes[sizeIndex].stock;
        console.log('Stock update check:', { product: product.name, size: item.size, current: currentStock, requested: item.quantity });
        
        if (currentStock < item.quantity) {
            console.error('Insufficient stock in updateProductStock:', { product: product.name, size: item.size, current: currentStock, requested: item.quantity });
            throw new Error(`Insufficient stock for ${item.name} in size ${item.size}. Only ${currentStock} available.`);
        }
        
        // Update stock
        product.sizes[sizeIndex].stock -= item.quantity;
        await product.save();
        console.log('Stock updated successfully:', { product: product.name, size: item.size, newStock: product.sizes[sizeIndex].stock });
    }
    console.log('All stock updates completed');
}

// Placing orders using COD Method
const placeOrder = async (req,res) => {
    try {
        const { userId, items, amount, address} = req.body;

        console.log('COD order request:', { userId, items: items.length, amount });

        // Update product stock
        console.log('Updating stock for COD order...');
        await updateProductStock(items);
        console.log('Stock updated for COD order');

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()
        console.log('COD order created:', newOrder._id);

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true,message:"Order Placed"})

    } catch (error) {
        console.error("COD Order Error:", error);
        console.error("COD Order Error Stack:", error.stack);
        res.json({success:false,message:error.message})
    }
}

const placeOrderPhonePe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        console.log('PhonePe order request:', { userId, items: items.length, amount, origin });

        // Check stock availability without reducing it
        console.log('Checking stock availability for PhonePe order...');
        await checkStockAvailability(items);
        console.log('Stock availability check passed for PhonePe order');

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "PhonePe",
            payment: false,
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();
        console.log('PhonePe order created:', newOrder._id);

        const merchantOrderId = newOrder._id.toString();
        const redirectUrl = `${origin}/verify?success=true&orderId=${merchantOrderId}&method=phonepe`;

        // Create PhonePe payment request using official SDK
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amount * 100) // Amount in paise
            .redirectUrl(redirectUrl)
            .build();

        console.log('Initiating PhonePe payment with merchant order ID:', merchantOrderId);
        console.log('PhonePe request details:', {
            merchantOrderId,
            amount: amount * 100,
            redirectUrl,
            merchantId: PHONEPE_MERCHANT_ID,
            clientId,
            clientSecret,
            env: 'SANDBOX',
            callbackUrl: "https://api.jjtextiles.com/api/order/verify-phonepe"
        });
        
        try {
            const response = await phonepeClient.pay(request);
            const checkoutPageUrl = response.redirectUrl;
            console.log('PhonePe payment initiated successfully, redirect URL generated:', checkoutPageUrl);

            res.json({ success: true, session_url: checkoutPageUrl });
        } catch (sdkError) {
            console.error("PhonePe SDK Error:", sdkError);
            
            // Fallback to direct API call if SDK fails
            console.log("Attempting fallback PhonePe API call...");
            
            const payload = {
                merchantId: PHONEPE_MERCHANT_ID,
                merchantTransactionId: merchantOrderId,
                amount: amount * 100,
                redirectUrl: redirectUrl,
                redirectMode: "POST",
                callbackUrl: "https://api.jjtextiles.com/api/order/verify-phonepe",
                merchantUserId: "MUID" + Date.now(),
                mobileNumber: "9999999999",
                paymentInstrument: {
                    type: "PAY_PAGE"
                },
                merchantOrderId: merchantOrderId
            };

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const checksum = sha256(base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY) + '###1';

            const fallbackResponse = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', 
                { request: base64Payload }, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'accept': 'application/json'
                    }
                }
            );

            console.log('PhonePe fallback API response:', fallbackResponse.data);
            
            if (fallbackResponse.data.success) {
                const redirectUrl = fallbackResponse.data.data.instrumentResponse.redirectInfo.url;
                console.log('PhonePe fallback redirect URL:', redirectUrl);
                res.json({ success: true, session_url: redirectUrl });
            } else {
                console.error('PhonePe fallback API error:', fallbackResponse.data);
                console.error('PhonePe API error details:', {
                    code: fallbackResponse.data.code,
                    message: fallbackResponse.data.message,
                    data: fallbackResponse.data.data
                });
                throw new Error(fallbackResponse.data.message || 'Payment initialization failed');
            }
        }

    } catch (error) {
        console.error("PhonePe Error:", error);
        console.error("PhonePe Error Stack:", error.stack);
        
        // Check for specific PhonePe error types
        if (error.message && error.message.includes('unauthorized')) {
            console.error("PhonePe Unauthorized Error - Check credentials and configuration");
            res.json({ success: false, message: "Payment gateway configuration error. Please try again later." });
        } else if (error.message && error.message.includes('network')) {
            console.error("PhonePe Network Error");
            res.json({ success: false, message: "Network error. Please try again." });
        } else if (error.response && error.response.status === 401) {
            console.error("PhonePe API Unauthorized Error");
            res.json({ success: false, message: "Payment gateway authentication failed. Please try again later." });
        } else if (error.response && error.response.status === 400) {
            console.error("PhonePe API Bad Request Error:", error.response.data);
            res.json({ success: false, message: "Invalid payment request. Please try again." });
        } else {
            res.json({ success: false, message: error.message || "Payment initialization failed" });
        }
    }
};


const verifyPhonePe = async (req, res) => {
    try {
        const authorizationHeaderData = req.headers['authorization'];
        const phonepeS2SCallbackResponseBodyString = JSON.stringify(req.body);

        if (!authorizationHeaderData || !phonepeS2SCallbackResponseBodyString) {
            return res.status(400).send({ success: false, message: "Invalid callback" });
        }

        const usernameConfigured = process.env.PHONEPE_USERNAME || "PGTESTPAYUAT";
        const passwordConfigured = process.env.PHONEPE_PASSWORD || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
        
        console.log('PhonePe webhook verification with credentials:', {
            username: usernameConfigured,
            hasPassword: !!passwordConfigured
        });

        try {
            console.log('PhonePe webhook data:', {
                hasAuthHeader: !!authorizationHeaderData,
                bodyLength: phonepeS2SCallbackResponseBodyString.length
            });
            
            const callbackResponse = phonepeClient.validateCallback(
                usernameConfigured,
                passwordConfigured,
                authorizationHeaderData,
                phonepeS2SCallbackResponseBodyString
            );

            const orderId = callbackResponse.payload.orderId;
            const state = callbackResponse.payload.state;
            
            console.log('PhonePe webhook validation successful:', { orderId, state });

            if (state === 'COMPLETED') {
                // Reduce stock only when payment is successful
                const order = await orderModel.findById(orderId);
                if (order) {
                    await updateProductStock(order.items);
                }
                await orderModel.findByIdAndUpdate(orderId, { payment: true });
                console.log(`Order ${orderId} payment confirmed via PhonePe webhook. Stock reduced.`);
            } else if (state === 'FAILED') {
                const order = await orderModel.findById(orderId);
                if (order) {
                    // Delete the order for failed payment (no stock to restore since we didn't reduce it)
                    await orderModel.findByIdAndDelete(orderId);
                    console.log(`Order ${orderId} failed. Order deleted.`);
                }
            }
            // For PENDING status, we do nothing in the webhook and rely on the cron job for reconciliation.

            return res.status(200).send({ success: true });

        } catch (validationError) {
            console.error("PhonePe webhook verification failed:", validationError);
            console.error("PhonePe webhook validation error stack:", validationError.stack);
            
            // Log the webhook data for debugging
            console.log("Webhook data for debugging:", {
                authorizationHeader: authorizationHeaderData ? authorizationHeaderData.substring(0, 50) + '...' : 'missing',
                bodyLength: phonepeS2SCallbackResponseBodyString.length,
                bodyPreview: phonepeS2SCallbackResponseBodyString.substring(0, 200) + '...'
            });
            
            return res.status(401).send({ success: false, message: "Webhook verification failed" });
        }

    } catch (error) {
        console.error('PhonePe verification error:', error);
        return res.status(500).send({ success: false, message: 'Internal server error' });
    }
};

const checkPhonePeStatus = async (req, res) => {
    const merchantOrderId = req.params.transactionId;

    try {
        console.log('Checking PhonePe status for order:', merchantOrderId);
        const response = await phonepeClient.getOrderStatus(merchantOrderId);
        const state = response.state;
        console.log('PhonePe status response:', { orderId: merchantOrderId, state });

        const order = await orderModel.findById(merchantOrderId);
        if (order) {
            if (state === 'COMPLETED' && order.payment === false) {
                await orderModel.findByIdAndUpdate(merchantOrderId, { payment: true });
                console.log(`Order ${merchantOrderId} payment confirmed via status check.`);
            } else if (state === 'FAILED' && order.payment === false) {
                // Restore stock for failed payment
                for (const item of order.items) {
                    const product = await productModel.findById(item._id);
                    if (product) {
                        const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
                        if (sizeIndex !== -1) {
                            product.sizes[sizeIndex].stock += item.quantity;
                            await product.save();
                        }
                    }
                }
                await orderModel.findByIdAndDelete(merchantOrderId);
                console.log(`Order ${merchantOrderId} failed. Stock restored via status check.`);
            }
        }

        res.json({ success: true, state: state });
    } catch (error) {
        console.error("PhonePe Status Check Error:", error);
        console.error("PhonePe Status Check Error Stack:", error.stack);
        
        if (error.message && error.message.includes('unauthorized')) {
            res.status(401).json({ success: false, message: "Payment gateway authentication failed" });
        } else if (error.message && error.message.includes('not found')) {
            res.status(404).json({ success: false, message: "Transaction not found" });
        } else {
            res.status(500).json({ success: false, message: error.message || "Status check failed" });
        }
    }
};

const refundPhonePe = async (orderId, amount) => {
    const merchantTransactionId = `refund_${Date.now()}`;
    const merchantId = PHONEPE_MERCHANT_ID;
    const originalTransactionId = orderId;
    const merchantUserId = "MUID123"; // You may want to fetch the actual user ID

    const payload = {
        merchantId: merchantId,
        merchantUserId: merchantUserId,
        originalTransactionId: originalTransactionId,
        merchantTransactionId: merchantTransactionId,
        amount: amount * 100, // Amount in paise
        callbackUrl: "https://api.jjtextiles.com/api/order/refund-callback-phonepe"
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = sha256(base64Payload + '/pg/v1/refund' + PHONEPE_SALT_KEY) + '###1';

    try {
        const response = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/refund', { request: base64Payload }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'accept': 'application/json'
            }
        });
        console.log("PhonePe Refund API Response:", response.data);
        console.log("PhonePe Refund Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("PhonePe Refund Error:", error.response ? error.response.data : error.message);
        console.error("PhonePe Refund Error Stack:", error.stack);
        
        if (error.response && error.response.status === 401) {
            return { success: false, message: "Payment gateway authentication failed" };
        } else if (error.response && error.response.status === 404) {
            return { success: false, message: "Transaction not found" };
        } else {
            return { success: false, message: error.message || "Refund failed" };
        }
    }
};

// Verify Stripe 
const verifyStripe = async (req, res) => {
    try {
        const { success, orderId } = req.body;
        
        if (!orderId) {
            return res.json({ success: false, message: 'Order ID is required' });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        if (success === 'true') {
            // Update order payment status
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            
            // Reduce stock for successful payment
            await updateProductStock(order.items);
            
            console.log(`Order ${orderId} payment confirmed via Stripe verification. Stock reduced.`);
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            // Delete order for failed payment
            await orderModel.findByIdAndDelete(orderId);
            console.log(`Order ${orderId} failed. Order deleted.`);
            res.json({ success: false, message: 'Payment failed' });
        }
    } catch (error) {
        console.error('Stripe verification error:', error);
        res.json({ success: false, message: error.message || 'Payment verification failed' });
    }
};

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req,res) => {
    try {
        const { userId, items, amount, address} = req.body

        // Check stock availability without reducing it
        await checkStockAvailability(items);

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Razorpay",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt : newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options, (error,order)=>{
            if (error) {
                console.log(error)
                return res.json({success:false, message: error})
            }
            res.json({success:true,order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const verifyRazorpay = async (req,res) => {
    try {
        const { userId, razorpay_order_id  } = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if (orderInfo.status === 'paid') {
            // Reduce stock only when payment is successful
            const order = await orderModel.findById(orderInfo.receipt);
            if (order) {
                await updateProductStock(order.items);
            }
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            res.json({ success: true, message: "Payment Successful" })
        } else {
            // If payment failed, delete the order (no stock to restore since we didn't reduce it)
            const order = await orderModel.findById(orderInfo.receipt);
            if (order) {
                await orderModel.findByIdAndDelete(orderInfo.receipt);
            }
             res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// All Orders data for Admin Panel
const allOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({})
            .sort({ date: -1 })
            .populate('userId', 'name email');
        res.json({success:true,orders})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// User Order Data For Frontend
const userOrders = async (req,res) => {
    try {
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
            .sort({ date: -1 });
        res.json({success:true,orders})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {
        const { orderId, status } = req.body;
        const adminId = req.user._id; // From adminAuth middleware

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // If status is being changed to cancelled
        if (status === 'Cancelled') {
            const admin = await userModel.findById(adminId);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin user not found'
                });
            }

            // Update order with cancellation details
            const updatedOrder = await orderModel.findByIdAndUpdate(
                orderId,
                {
                    status: 'Cancelled',
                    cancelledBy: {
                        name: admin.name,
                        userId: adminId,
                        timestamp: new Date(),
                        role: 'admin'
                    }
                },
                { new: true }
            );

            // If order was paid, handle refund logic here
            if (order.payment) {
                // TODO: Implement refund logic based on payment method
                console.log(`Paid order cancelled by admin: ${orderId}. Refund should be processed.`);
            }

            // Restore product stock
            for (const item of order.items) {
                const product = await productModel.findById(item._id);
                if (product) {
                    const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
                    if (sizeIndex !== -1) {
                        product.sizes[sizeIndex].stock += item.quantity;
                        await product.save();
                    }
                }
            }

            return res.json({
                success: true,
                message: 'Order cancelled successfully'
            });
        } else {
            // Regular status update
            await orderModel.findByIdAndUpdate(orderId, { status });
            return res.json({
                success: true,
                message: 'Status Updated'
            });
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user._id; // This comes from the verifyToken middleware

        const order = await orderModel.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to cancel this order'
            });
        }

        // Check if order can be cancelled
        if (!['Order Placed', 'Packing'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        // Get user details for the cancellation record
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update order status and add cancellation details
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                status: 'Cancelled',
                cancelledBy: {
                    name: user.name,
                    userId: userId,
                    timestamp: new Date(),
                    role: 'customer' // To distinguish from admin cancellations
                }
            },
            { new: true }
        );

        // If order was paid, handle refund logic here
        if (order.payment) {
            if (order.paymentMethod === 'PhonePe') {
                await refundPhonePe(order._id, order.amount);
            } else {
                // TODO: Implement refund logic for other payment methods
                console.log(`Paid order cancelled: ${orderId}. Refund should be processed.`);
            }
        }

        // Restore product stock only if payment was successful (stock was reduced)
        if (order.payment) {
            for (const item of order.items) {
                const product = await productModel.findById(item._id);
                if (product) {
                    const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
                    if (sizeIndex !== -1) {
                        product.sizes[sizeIndex].stock += item.quantity;
                        await product.save();
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user orders
const getUserOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.user._id })
            .sort({ date: -1 })
            .populate('cancelledBy.userId', 'name');

        let allOrdersItem = [];
        orders.forEach((order) => {
            order.items.forEach((item) => {
                item.status = order.status;
                item.payment = order.payment;
                item.paymentMethod = order.paymentMethod;
                item.date = order.date;
                item.cancelledBy = order.cancelledBy;
                item._id = order._id;
                allOrdersItem.push(item);
            });
        });

        res.json({
            success: true,
            orders: allOrdersItem.reverse()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
            .sort({ date: -1 })
            .populate('cancelledBy.userId', 'name');

        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// Get order statistics (admin)
const getOrderStats = async (req, res) => {
    try {
        const orders = await orderModel.find();
        
        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.filter(order => order.payment).reduce((sum, order) => sum + order.amount, 0),
            pendingOrders: orders.filter(order => !order.payment).length,
            completedOrders: orders.filter(order => order.payment && order.status === 'Delivered').length,
            cancelledOrders: orders.filter(order => order.status === 'Cancelled').length,
            phonePeOrders: orders.filter(order => order.paymentMethod === 'PhonePe').length,
            codOrders: orders.filter(order => order.paymentMethod === 'COD').length,
            recentOrders: orders.slice(0, 5)
        };
        
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order stats' });
    }
};

const placeOrderStripe = async (req, res) => {
    try {
        res.json({ 
            success: false, 
            message: "Stripe payment integration not implemented yet" 
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export {verifyRazorpay, verifyStripe, verifyPhonePe, placeOrder, placeOrderRazorpay, placeOrderPhonePe, allOrders, userOrders, updateStatus, cancelOrder, getUserOrders, getAllOrders, checkPhonePeStatus, refundPhonePe, getOrderStats, placeOrderStripe}






