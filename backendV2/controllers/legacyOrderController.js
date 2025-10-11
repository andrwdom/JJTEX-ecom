import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { successResponse, errorResponse } from '../utils/response.js';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from 'pg-sdk-node';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import Logger from '../utils/logger.js';
import { reserveStock, releaseStock, checkStockAvailability } from './stockController.js.disabled';

// Global variables matching old backend
const currency = 'inr';
const deliveryCharge = 10;

// PhonePe configuration matching old backend
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "TEST-M2265MTOB2G4J_25072";
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "OGM0ZTk2NjctZDE5OS00YzViLTkxMzYtYTEwNDQ1YmE3NDFi";

// Initialize PhonePe client with correct test credentials
const clientId = process.env.PHONEPE_MERCHANT_ID || "TEST-M2265MTOB2G4J_25072";
const clientSecret = process.env.PHONEPE_API_KEY || "OGM0ZTk2NjctZDE5OS00YzViLTkxMzYtYTEwNDQ1YmE3NDFi";
const clientVersion = 1;
const env = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

const phonepeClient = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

// Log PhonePe client configuration
console.log('🔧 PhonePe client initialized with:', {
    clientId,
    clientSecret: clientSecret ? '***' + clientSecret.slice(-4) : 'missing',
    clientVersion,
    env: env === Env.SANDBOX ? 'SANDBOX' : 'PRODUCTION',
    merchantId: PHONEPE_MERCHANT_ID,
    saltKey: PHONEPE_SALT_KEY ? '***' + PHONEPE_SALT_KEY.slice(-4) : 'missing'
});

/**
 * Enhanced stock availability check with reservation system
 */
async function checkStockAvailability(items) {
    console.log('🔍 checkStockAvailability called with items:', items.length);
    
    const stockChecks = [];
    
    for (const item of items) {
        console.log('🔍 Checking stock for item:', { 
            id: item._id, 
            name: item.name, 
            size: item.size, 
            quantity: item.quantity 
        });
        
        const product = await productModel.findById(item._id);
        if (!product) {
            console.error('❌ Product not found:', item._id);
            throw new Error(`Product ${item.name} not found`);
        }
        
        const sizeObj = product.sizes.find(s => s.size === item.size);
        if (!sizeObj) {
            console.error('❌ Size not found:', { product: product.name, size: item.size });
            throw new Error(`Size ${item.size} not found for product ${item.name}`);
        }
        
        // Calculate available stock (stock - reserved)
        const availableStock = Math.max(0, (sizeObj.stock || 0) - (sizeObj.reserved || 0));
        
        console.log('🔍 Stock check result:', { 
            product: product.name, 
            size: item.size, 
            totalStock: sizeObj.stock,
            reserved: sizeObj.reserved || 0,
            available: availableStock, 
            requested: item.quantity 
        });
        
        if (availableStock < item.quantity) {
            console.error('❌ Insufficient stock:', { 
                product: product.name, 
                size: item.size, 
                available: availableStock, 
                requested: item.quantity 
            });
            throw new Error(`Insufficient stock for ${item.name} in size ${item.size}. Only ${availableStock} available.`);
        }
        
        stockChecks.push({
            productId: product._id,
            size: item.size,
            quantity: item.quantity,
            availableStock: availableStock
        });
    }
    
    console.log('✅ All stock availability checks passed');
    return stockChecks;
}

/**
 * Enhanced stock update with reservation system
 */
async function updateProductStock(items, session = null) {
    console.log('📦 updateProductStock called with items:', items.length);
    
    const useSession = session || await mongoose.startSession();
    const shouldStartTransaction = !session;
    
    if (shouldStartTransaction) {
        useSession.startTransaction();
    }
    
    try {
        for (const item of items) {
            console.log('📦 Updating stock for item:', { 
                id: item._id, 
                name: item.name, 
                size: item.size, 
                quantity: item.quantity 
            });
            
            const product = await productModel.findById(item._id).session(useSession);
            if (!product) {
                console.error('❌ Product not found in updateProductStock:', item._id);
                throw new Error(`Product ${item.name} not found`);
            }
            
            const sizeObj = product.sizes.find(s => s.size === item.size);
            if (!sizeObj) {
                console.error('❌ Size not found in updateProductStock:', { product: product.name, size: item.size });
                throw new Error(`Size ${item.size} not found for product ${item.name}`);
            }
            
            const availableStock = Math.max(0, (sizeObj.stock || 0) - (sizeObj.reserved || 0));
            
            console.log('📦 Stock update check:', { 
                product: product.name, 
                size: item.size, 
                totalStock: sizeObj.stock,
                reserved: sizeObj.reserved || 0,
                available: availableStock, 
                requested: item.quantity 
            });
            
            if (availableStock < item.quantity) {
                console.error('❌ Insufficient stock in updateProductStock:', { 
                    product: product.name, 
                    size: item.size, 
                    available: availableStock, 
                    requested: item.quantity 
                });
                throw new Error(`Insufficient stock for ${item.name} in size ${item.size}. Only ${availableStock} available.`);
            }
            
            // Update stock atomically
            const result = await productModel.updateOne(
                {
                    _id: product._id,
                    'sizes.size': item.size,
                    'sizes.stock': { $gte: item.quantity }
                },
                {
                    $inc: { 'sizes.$.stock': -item.quantity }
                },
                { session: useSession }
            );
            
            if (result.modifiedCount === 0) {
                throw new Error(`Failed to update stock for ${item.name} (${item.size}) - stock may have changed`);
            }
            
            console.log('✅ Stock updated successfully:', { 
                product: product.name, 
                size: item.size, 
                quantity: item.quantity 
            });
        }
        
        if (shouldStartTransaction) {
            await useSession.commitTransaction();
        }
        
        console.log('✅ All stock updates completed successfully');
        
    } catch (error) {
        if (shouldStartTransaction) {
            await useSession.abortTransaction();
        }
        console.error('❌ Stock update failed:', error);
        throw error;
    } finally {
        if (shouldStartTransaction) {
            await useSession.endSession();
        }
    }
}

/**
 * Generate unique order ID
 */
async function generateOrderId() {
    try {
        const counter = await mongoose.connection.db.collection('counters').findOneAndUpdate(
            { _id: 'orderId' },
            { $inc: { sequence_value: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        return `ORD${String(counter.value.sequence_value).padStart(6, '0')}`;
    } catch (error) {
        console.error('Error generating order ID:', error);
        return `ORD${Date.now()}`;
    }
}

/**
 * Legacy Place Order - COD
 */
export const placeOrder = async (req, res) => {
    const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        console.log(`[${correlationId}] Place Order (COD) - Starting`);
        console.log(`[${correlationId}] Request body:`, req.body);
        
        const { userId, address, items, amount } = req.body;
        
        if (!userId || !address || !items || !Array.isArray(items) || items.length === 0) {
            return errorResponse(res, 400, 'Missing required fields: userId, address, items');
        }
        
        // Validate user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }
        
        console.log(`[${correlationId}] User found:`, user.email);
        
        // Check stock availability
        await checkStockAvailability(items);
        
        // Start transaction for atomic order creation
        const session = await mongoose.startSession();
        
        try {
            await session.withTransaction(async () => {
                // Generate order ID
                const orderId = await generateOrderId();
                
                // Create order
                const orderData = {
                    orderId,
                    userId: userId,
                    userInfo: {
                        userId: userId,
                        email: user.email,
                        name: `${address.firstName} ${address.lastName}`
                    },
                    shippingInfo: {
                        fullName: `${address.firstName} ${address.lastName}`,
                        email: address.email || user.email,
                        phone: address.phone,
                        addressLine1: address.street,
                        addressLine2: '',
                        city: address.city,
                        state: address.state,
                        postalCode: address.zipcode,
                        country: address.country || 'India'
                    },
                    items: items,
                    cartItems: items, // Legacy compatibility
                    totalAmount: amount,
                    total: amount,
                    subtotal: amount - deliveryCharge,
                    shippingCost: deliveryCharge,
                    paymentMethod: 'COD',
                    paymentStatus: 'pending',
                    orderStatus: 'Order Placed',
                    status: 'Order Placed',
                    payment: false,
                    date: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    stockConfirmed: false,
                    metadata: {
                        correlationId,
                        source: 'legacy_api',
                        paymentType: 'cod'
                    }
                };
                
                const order = await orderModel.create([orderData], { session });
                console.log(`[${correlationId}] Order created:`, order[0].orderId);
                
                // Update stock
                await updateProductStock(items, session);
                
                // Mark order as stock confirmed
                await orderModel.findByIdAndUpdate(
                    order[0]._id,
                    { 
                        stockConfirmed: true,
                        stockConfirmedAt: new Date()
                    },
                    { session }
                );
                
                console.log(`[${correlationId}] Stock updated and order confirmed`);
            });
            
            // Clear user's cart
            await userModel.findByIdAndUpdate(userId, { cartData: {} });
            console.log(`[${correlationId}] User cart cleared`);
            
            return successResponse(res, { 
                message: 'Order placed successfully',
                orderId: (await orderModel.findOne({ userId })).orderId
            });
            
        } catch (transactionError) {
            console.error(`[${correlationId}] Transaction failed:`, transactionError);
            
            // Check if it's a replica set error
            if (transactionError.message && transactionError.message.includes('Transaction numbers are only allowed on a replica set')) {
                console.log(`[${correlationId}] MongoDB not configured as replica set, using non-transactional approach`);
                
                // Fallback: Non-transactional approach
                const orderId = await generateOrderId();
                
                // Create order
                const orderData = {
                    orderId,
                    userId: userId,
                    userInfo: {
                        userId: userId,
                        email: user.email,
                        name: `${address.firstName} ${address.lastName}`
                    },
                    shippingInfo: {
                        fullName: `${address.firstName} ${address.lastName}`,
                        email: address.email || user.email,
                        phone: address.phone,
                        addressLine1: address.street,
                        addressLine2: '',
                        city: address.city,
                        state: address.state,
                        postalCode: address.zipcode,
                        country: address.country || 'India'
                    },
                    items: items,
                    cartItems: items,
                    totalAmount: amount,
                    total: amount,
                    subtotal: amount - deliveryCharge,
                    shippingCost: deliveryCharge,
                    paymentMethod: 'COD',
                    paymentStatus: 'pending',
                    orderStatus: 'Order Placed',
                    status: 'Order Placed',
                    payment: false,
                    date: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    stockConfirmed: false,
                    metadata: {
                        correlationId,
                        source: 'legacy_api',
                        paymentType: 'cod',
                        fallback: true
                    }
                };
                
                const order = await orderModel.create(orderData);
                console.log(`[${correlationId}] Order created (fallback):`, order.orderId);
                
                // Update stock
                await updateProductStock(items);
                
                // Mark order as stock confirmed
                await orderModel.findByIdAndUpdate(order._id, { 
                    stockConfirmed: true,
                    stockConfirmedAt: new Date()
                });
                
                // Clear user's cart
                await userModel.findByIdAndUpdate(userId, { cartData: {} });
                
                return successResponse(res, { 
                    message: 'Order placed successfully',
                    orderId: order.orderId
                });
            } else {
                throw transactionError;
            }
        } finally {
            await session.endSession();
        }
        
    } catch (error) {
        console.error(`[${correlationId}] Place Order Error:`, error);
        return errorResponse(res, 500, error.message);
    }
};

/**
 * Legacy PhonePe Payment
 */
export const placeOrderPhonePe = async (req, res) => {
    const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        console.log(`[${correlationId}] Place Order (PhonePe) - Starting`);
        console.log(`[${correlationId}] Request body:`, req.body);
        
        const { userId, address, items, amount } = req.body;
        
        if (!userId || !address || !items || !Array.isArray(items) || items.length === 0) {
            return errorResponse(res, 400, 'Missing required fields: userId, address, items');
        }
        
        // Validate user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }
        
        console.log(`[${correlationId}] User found:`, user.email);
        
        // Check stock availability
        await checkStockAvailability(items);
        
        // Generate unique transaction ID
        const phonepeTransactionId = randomUUID();
        const orderId = await generateOrderId();
        
        // Create draft order
        const orderData = {
            orderId,
            userId: userId,
            userInfo: {
                userId: userId,
                email: user.email,
                name: `${address.firstName} ${address.lastName}`
            },
            shippingInfo: {
                fullName: `${address.firstName} ${address.lastName}`,
                email: address.email || user.email,
                phone: address.phone,
                addressLine1: address.street,
                addressLine2: '',
                city: address.city,
                state: address.state,
                postalCode: address.zipcode,
                country: address.country || 'India'
            },
            items: items,
            cartItems: items,
            totalAmount: amount,
            total: amount,
            subtotal: amount - deliveryCharge,
            shippingCost: deliveryCharge,
            paymentMethod: 'PhonePe',
            paymentStatus: 'pending',
            orderStatus: 'DRAFT',
            status: 'DRAFT',
            payment: false,
            phonepeTransactionId,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            stockReserved: false,
            stockConfirmed: false,
            metadata: {
                correlationId,
                source: 'legacy_api',
                paymentType: 'phonepe'
            }
        };
        
        const order = await orderModel.create(orderData);
        console.log(`[${correlationId}] Draft order created:`, order.orderId);
        
        // Create PhonePe payment request
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/phonepe/callback?merchantTransactionId=${phonepeTransactionId}`;
        const amountInPaise = Math.round(amount * 100);
        
        console.log(`[${correlationId}] PhonePe payment details:`, {
            merchantOrderId: phonepeTransactionId,
            amount: amountInPaise,
            redirectUrl
        });
        
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(phonepeTransactionId)
            .amount(amountInPaise)
            .redirectUrl(redirectUrl)
            .build();
        
        try {
            const response = await phonepeClient.pay(request);
            
            if (response && response.redirectUrl) {
                // Update order with PhonePe response
                await orderModel.findByIdAndUpdate(order._id, {
                    'metadata.phonepeRedirectUrl': response.redirectUrl,
                    'metadata.phonepeResponse': {
                        redirectUrl: response.redirectUrl,
                        merchantOrderId: phonepeTransactionId,
                        responseCode: response.code || 'SUCCESS',
                        responseMessage: response.message || 'Payment session created'
                    }
                });
                
                console.log(`[${correlationId}] PhonePe payment session created successfully`);
                
                return successResponse(res, {
                    success: true,
                    session_url: response.redirectUrl,
                    orderId: order.orderId,
                    phonepeTransactionId: phonepeTransactionId,
                    message: 'Payment session created successfully'
                });
            } else {
                throw new Error('PhonePe did not return redirect URL');
            }
        } catch (phonepeError) {
            console.error(`[${correlationId}] PhonePe payment creation failed:`, phonepeError);
            
            // Cancel the draft order
            await orderModel.findByIdAndUpdate(order._id, {
                status: 'CANCELLED',
                orderStatus: 'CANCELLED',
                paymentStatus: 'FAILED',
                metadata: {
                    ...order.metadata,
                    cancellationReason: `PhonePe error: ${phonepeError.message}`,
                    cancelledAt: new Date()
                }
            });
            
            return errorResponse(res, 500, 'Payment service temporarily unavailable');
        }
        
    } catch (error) {
        console.error(`[${correlationId}] Place Order PhonePe Error:`, error);
        return errorResponse(res, 500, error.message);
    }
};

/**
 * Legacy User Orders
 */
export const userOrders = async (req, res) => {
    try {
        if (!req.user) {
            return errorResponse(res, 401, 'Authentication required');
        }
        
        const userId = req.user.id;
        const userEmail = req.user.email;
        
        const orQuery = [];
        if (userId) {
            orQuery.push({ userId: userId });
            if (typeof userId === 'string' && userId.length === 24 && /^[a-fA-F0-9]{24}$/.test(userId)) {
                try {
                    const { Types } = await import('mongoose');
                    const objectId = Types.ObjectId(userId);
                    orQuery.push({ userId: objectId });
                } catch (e) {
                    // ignore invalid ObjectId
                }
            }
        }
        if (userEmail) {
            orQuery.push({ 'userInfo.email': userEmail });
        }
        
        if (orQuery.length === 0) {
            return errorResponse(res, 400, 'No valid user identifier found');
        }
        
        const orders = await orderModel.find({ $or: orQuery })
            .sort({ date: -1, createdAt: -1 })
            .limit(50);
        
        // Transform orders to match legacy format
        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderId: order.orderId,
            userId: order.userInfo?.userId || order.userId,
            items: order.items || order.cartItems,
            address: order.shippingInfo,
            amount: order.totalAmount,
            status: order.status,
            payment: order.payment,
            paymentMethod: order.paymentMethod,
            date: order.date || order.createdAt
        }));
        
        return successResponse(res, transformedOrders, 'Orders fetched successfully');
        
    } catch (error) {
        console.error('User Orders Error:', error);
        return errorResponse(res, 500, error.message);
    }
};

/**
 * Legacy Verify PhonePe
 */
export const verifyPhonePe = async (req, res) => {
    try {
        const { merchantTransactionId, state, responseCode } = req.body;
        
        console.log('PhonePe Verification:', { merchantTransactionId, state, responseCode });
        
        if (!merchantTransactionId) {
            return errorResponse(res, 400, 'Missing merchant transaction ID');
        }
        
        // Find order
        const order = await orderModel.findOne({ phonepeTransactionId: merchantTransactionId });
        if (!order) {
            return errorResponse(res, 404, 'Order not found');
        }
        
        const isSuccess = (
            state === 'PAID' ||
            state === 'COMPLETED' ||
            responseCode === 'SUCCESS' ||
            responseCode === '000'
        );
        
        if (isSuccess) {
            // Update order status
            await orderModel.findByIdAndUpdate(order._id, {
                payment: true,
                paymentStatus: 'paid',
                orderStatus: 'Order Placed',
                status: 'Order Placed',
                paidAt: new Date(),
                phonepeResponse: req.body
            });
            
            // Update stock
            await updateProductStock(order.items);
            
            // Mark as stock confirmed
            await orderModel.findByIdAndUpdate(order._id, {
                stockConfirmed: true,
                stockConfirmedAt: new Date()
            });
            
            // Clear user's cart
            if (order.userId) {
                await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
            }
            
            console.log('Order verified and stock updated:', order.orderId);
        }
        
        return successResponse(res, {
            success: isSuccess,
            orderId: order.orderId,
            status: isSuccess ? 'Order Placed' : 'Payment Failed'
        });
        
    } catch (error) {
        console.error('Verify PhonePe Error:', error);
        return errorResponse(res, 500, error.message);
    }
};

/**
 * Legacy Check PhonePe Status
 */
export const checkPhonePeStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        if (!transactionId) {
            return errorResponse(res, 400, 'Transaction ID is required');
        }
        
        // Find order
        const order = await orderModel.findOne({ phonepeTransactionId: transactionId });
        if (!order) {
            return errorResponse(res, 404, 'Order not found');
        }
        
        // Check payment status with PhonePe
        try {
            const paymentStatus = await phonepeClient.getOrderStatus(transactionId);
            
            return successResponse(res, {
                orderId: order.orderId,
                status: order.status,
                payment: order.payment,
                phonepeStatus: paymentStatus
            });
        } catch (phonepeError) {
            console.error('PhonePe status check error:', phonepeError);
            return successResponse(res, {
                orderId: order.orderId,
                status: order.status,
                payment: order.payment,
                phonepeError: phonepeError.message
            });
        }
        
    } catch (error) {
        console.error('Check PhonePe Status Error:', error);
        return errorResponse(res, 500, error.message);
    }
};

/**
 * Legacy Cancel Order
 */
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return errorResponse(res, 400, 'Order ID is required');
        }
        
        const order = await orderModel.findOne({ orderId });
        if (!order) {
            return errorResponse(res, 404, 'Order not found');
        }
        
        // Check if order can be cancelled
        if (order.status === 'CANCELLED' || order.status === 'Delivered') {
            return errorResponse(res, 400, 'Order cannot be cancelled');
        }
        
        // Release stock if order was confirmed
        if (order.stockConfirmed && order.items) {
            try {
                // Add stock back
                for (const item of order.items) {
                    await productModel.updateOne(
                        { _id: item._id, 'sizes.size': item.size },
                        { $inc: { 'sizes.$.stock': item.quantity } }
                    );
                }
                console.log('Stock released for cancelled order:', order.orderId);
            } catch (stockError) {
                console.error('Error releasing stock:', stockError);
            }
        }
        
        // Update order status
        await orderModel.findByIdAndUpdate(order._id, {
            status: 'CANCELLED',
            orderStatus: 'CANCELLED',
            paymentStatus: 'CANCELLED',
            cancelledAt: new Date(),
            metadata: {
                ...order.metadata,
                cancellationReason: 'User requested cancellation',
                cancelledBy: req.user?.id
            }
        });
        
        return successResponse(res, { message: 'Order cancelled successfully' });
        
    } catch (error) {
        console.error('Cancel Order Error:', error);
        return errorResponse(res, 500, error.message);
    }
};
