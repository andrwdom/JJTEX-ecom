const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        name: String,
        price: Number,
        quantity: Number,
        size: String,
        image: [String]
    }],
    address: {
        firstName: String,
        lastName: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String,
        phone: String
    },
    amount: Number,
    status: {
        type: String,
        enum: ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled'],
        default: 'Order Placed'
    },
    payment: {
        type: Boolean,
        default: false
    },
    paymentMethod: String,
    date: {
        type: Date,
        default: Date.now
    },
    cancelledBy: {
        name: String,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }
});

module.exports = mongoose.model('Order', orderSchema); 