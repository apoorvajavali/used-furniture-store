const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const OrderSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
    }],
    date: {
        type: Date,
        required: true,
        default: new Date()
    }
});

module.exports = mongoose.model('orders', OrderSchema);