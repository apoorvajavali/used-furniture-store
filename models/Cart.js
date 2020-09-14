const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const CartSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
    }]
});

module.exports = mongoose.model('cart', CartSchema);