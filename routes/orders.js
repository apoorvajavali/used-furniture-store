const express = require('express');
const Router = express.Router();
const multer = require('multer');


const Order = require('../models/Order');
const Product = require('../models/Product');


Router.get('/:user', (req, res) => {
    Order.find({user: req.params.user}, function(err, orders) {
        if(err) throw err;
        
        res.json(orders);
    });
});

Router.post('/:user/place-order', (req, res) => {

    const newOrder = new Order({
        user: req.params.user,
        products: req.body.products,
        date: new Date()
    });

    newOrder.save()
        .then(order => {
            req.body.products.forEach(element => {
                Product.updateOne({_id: element}, {$set: {
                        available: false
                    }
                }, function(err, product) {
                    if (err) throw err;
                    console.log('Success');
                });
            }); 
            res.json(order);
        })
        .catch(err => console.log(err));
});


module.exports = Router;