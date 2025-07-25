import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import sha256 from "sha256";
import axios from "axios";

// global variables
const currency = 'inr'
const deliveryCharge = 10

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;

async function updateProductStock(items) {
    for (const item of items) {
        const product = await productModel.findById(item._id);
        if (!product) {
            throw new Error(`Product ${item.name} not found`);
        }
        
        // Find the size object and update stock
        const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
        if (sizeIndex === -1) {
            throw new Error(`Size ${item.size} not found for product ${item.name}`);
        }
        
        if (product.sizes[sizeIndex].stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name} in size ${item.size}. Only ${product.sizes[sizeIndex].stock} available.`);
        }
        
        // Update stock
        product.sizes[sizeIndex].stock -= item.quantity;
        await product.save();
    }
}

// Placing orders using COD Method
const placeOrder = async (req,res) => {
    try {
        const { userId, items, amount, address} = req.body;

        // Update product stock
        await updateProductStock(items);

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

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true,message:"Order Placed"})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const placeOrderPhonePe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        await updateProductStock(items);

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

        const merchantTransactionId = newOrder._id.toString();
        
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: userId,
            amount: amount * 100, // Amount in paise
            redirectUrl: `${origin}/verify?success=true&orderId=${merchantTransactionId}`,
            redirectMode: "REDIRECT",
            callbackUrl: `${process.env.BACKEND_URL}/api/order/verify-phonepe`,
            mobileNumber: address.phone || '9999999999',
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const checksum = sha256(base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY) + '###1';

        const response = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', { request: base64Payload }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'accept': 'application/json'
            }
        });

        res.json({ success: true, session_url: response.data.data.instrumentResponse.redirectInfo.url });

    } catch (error) {
        console.error("PhonePe Error:", error.response ? error.response.data : error.message);
        res.json({ success: false, message: error.message });
    }
};


const verifyPhonePe = async (req, res) => {
    try {
        const x_verify = req.headers['x-verify'];
        const responsePayload = req.body.response;

        if (!responsePayload || !x_verify) {
            return res.status(400).send({ success: false, message: "Invalid callback" });
        }

        const decodedResponse = JSON.parse(Buffer.from(responsePayload, 'base64').toString('utf8'));
        const { merchantId, merchantTransactionId, state } = decodedResponse;
        
        const saltKey = PHONEPE_SALT_KEY;
        const saltIndex = 1;

        const calculated_x_verify = sha256(responsePayload + saltKey) + '###' + saltIndex;
        
        if (x_verify !== calculated_x_verify) {
            console.error("PhonePe webhook verification failed: Checksum mismatch");
            return res.status(401).send({ success: false, message: "Webhook verification failed" });
        }
        
        if (state === 'COMPLETED') {
            await orderModel.findByIdAndUpdate(merchantTransactionId, { payment: true });
            console.log(`Order ${merchantTransactionId} payment confirmed via PhonePe webhook.`);
        } else if (state === 'FAILED') {
            const order = await orderModel.findById(merchantTransactionId);
            if (order) {
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
                await orderModel.findByIdAndDelete(merchantTransactionId);
                console.log(`Order ${merchantTransactionId} failed. Stock restored.`);
            }
        }
        // For PENDING status, we do nothing in the webhook and rely on the cron job for reconciliation.
        
        return res.status(200).send({ success: true });

    } catch (error) {
        console.error('PhonePe verification error:', error);
        return res.status(500).send({ success: false, message: 'Internal server error' });
    }
};

const checkPhonePeStatus = async (req, res) => {
    const merchantTransactionId = req.params.transactionId;
    const merchantId = PHONEPE_MERCHANT_ID;

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + PHONEPE_SALT_KEY;
    const sha256_val = sha256(string);
    const x_verify = sha256_val + '###' + keyIndex;

    try {
        const response = await axios.get(`https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': x_verify,
                'X-MERCHANT-ID': merchantId
            }
        });

        if (response.data.success) {
            const order = await orderModel.findById(merchantTransactionId);
            if (response.data.code === 'PAYMENT_SUCCESS' && order.payment === false) {
                await orderModel.findByIdAndUpdate(merchantTransactionId, { payment: true });
                console.log(`Order ${merchantTransactionId} payment confirmed via status check.`);
            } else if (response.data.code === 'PAYMENT_ERROR' && order.payment === false) {
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
                await orderModel.findByIdAndDelete(merchantTransactionId);
                console.log(`Order ${merchantTransactionId} failed. Stock restored via status check.`);
            }
        }
        res.json(response.data);
    } catch (error) {
        console.error("PhonePe Status Check Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: error.message });
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
        callbackUrl: `${process.env.BACKEND_URL}/api/order/refund-callback-phonepe`
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
        console.log("PhonePe Refund Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("PhonePe Refund Error:", error.response ? error.response.data : error.message);
        return { success: false, message: error.message };
    }
};

// Verify Stripe 
const verifyStripe = async (req,res) => {
    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});
        } else {
            // If payment failed, restore stock
            const order = await orderModel.findById(orderId);
            if (order) {
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
                await orderModel.findByIdAndDelete(orderId);
            }
            res.json({success:false})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req,res) => {
    try {
        const { userId, items, amount, address} = req.body

        // Update product stock
        await updateProductStock(items);

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
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            res.json({ success: true, message: "Payment Successful" })
        } else {
            // If payment failed, restore stock
            const order = await orderModel.findById(orderInfo.receipt);
            if (order) {
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

export {verifyPhonePe, placeOrder, placeOrderPhonePe, allOrders, userOrders, updateStatus, cancelOrder, getUserOrders, getAllOrders, checkPhonePeStatus, refundPhonePe}





