const express = require('express');
const Router = express.Router();
const passport = require('passport');
const multer = require('multer');
const mongoose = require('mongoose');
const {ensureAuthenticated} = require('../helpers/auth');

// Pagination
const paginateResults = require('../helpers/pagination');

const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads/');
    },
    filename: function(req, file, callback) {
        callback(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const fileFilter = function(req, file, callback) {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        callback(null, true);
    } else {
        callback(null, false)
    }
}

const upload = multer({storage: storage, 
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

// Load Input Validation
const validateProduct = require('../validation/addproduct');

// Load User model
const Product = require('../models/Product');

// Load Cart model
const Cart = require('../models/Cart');

// Load Order model
const Order = require('../models/Order');

// @route GET /products
// @desc Retrieve products
// @access Public
Router.get('/', (req, res) => {

    var category = req.query.category;
    var search = req.query.search;

    var query = {};
    query['$and'] = []
    query['$and'].push({
        deleted: false
    });

    if(category && category != "0"){
        query['$and'].push({
            category_id: parseInt(category)
        });
    }

    if(search && search.trim() != ""){
        query['$and'].push({
            $or: [{
                name: new RegExp(search, 'i')},
                {description: RegExp(search, 'i')
            }]
        });
    }

    Product.find(query, function(err, products) {
        if(err) throw err;
        paginated = paginateResults(products, req.query.page || 1);
        pagination = {}
        if (paginated.next) {
            pagination.next = paginated.next.page
        }
        if (paginated.previous) {
            pagination.previous = paginated.previous.page
        }
        if (req.user) { 
            Cart.findOne({user: req.user._id}, function(err, cart) {
                if(cart) {
                    res.render('index', {
                        products: paginated.results, 
                        cart: cart.products,
                        pagination: pagination,
                        query: search,
                        category: category
                    });
                } else {
                    res.render('index', {
                        products: paginated.results, 
                        pagination: pagination,
                        query: search,
                        category: category
                    });
                }
            });
        } else {
            res.render('index', {
                products: paginated.results, 
                pagination: pagination,
                query: search,
                category: category
            });
        }
    });
});


Router.get('/add-product', ensureAuthenticated, (req, res) => {
    res.render('addproduct');
});

// @route POST /products/add-product
// @desc  add product
// @access Public
Router.post('/add-product', 
    ensureAuthenticated, 
    upload.single('image'), 
    (req, res) => {
    
        // Check validation
        const {errors, isValid} = validateProduct(req.body);
    
        if(!isValid){
            return res.status(400).json(errors);
        }

        const newProduct = new Product({
            name: req.body.name,
            description: req.body.description,
            category_id: req.body.category,
            price: req.body.price,
            image: req.file.path
        });
        newProduct.save()
            .then(function(product) {
                res.redirect('/products');
            })
            .catch(function(err) {
                throw err;
            });
    }
);

// View cart
Router.get('/cart', (req, res) => {
    if(req.user) {
        Cart.findOne({user: req.user._id})
            .populate('products')
            .exec(function(err, cart) {
                if(cart) {
                    res.render('cart', {cart: cart.products});
                } else {
                    res.render('cart');
                }
            });
    } else {
        res.redirect('/users/login');
    }
});

// Place order
Router.get('/cart/place-order', (req, res) => {
    if(req.user) {
        Cart.findOne({user: req.user._id}, function(err, cart) {
            let newOrder = new Order({
                user: req.user._id
            });
            cart.products.forEach(element => {
                newOrder.products.push(mongoose.Types.ObjectId(element));
            });
            
            newOrder.save()
                .then(function(err, order) {
                    Cart.deleteOne({user: req.user._id}, function(err, response) {
                        cart.products.forEach(element => {
                            Product.updateOne({_id: element},
                                {$set: {available: false}},
                                function(err, prod) {
                                if(err) throw err
                            });
                        });
                        req.flash('success_msg', 'Order Successfully Placed!');
                        res.redirect('back');
                    });
                });
            });
    } else {
        res.redirect('/users/login');
    }
});

// View orders
Router.get('/view-orders', (req, res) => {
    if(req.user){
        Order.find({user: req.user._id})
        .populate('products')
        .exec(function(err, orders) {
            Cart.findOne({user: req.user._id}, function(err, cart) {
                if(cart) {
                    res.render('orders', {orders: orders, cart: cart.products});
                } else {
                    res.render('orders', {orders: orders});
                }
            });
        });
    } else {
        res.redirect('/users/login');
    }
});

// View product
Router.get('/:id', (req, res) => {
    Product.findOne({_id: req.params.id}, function(err, product) {
        if(err) throw err;
        res.render('product', {product: product});
    });
});

// Render edit product page
Router.get('/:id/edit-product', ensureAuthenticated, (req, res) => {
    Product.findOne({_id: req.params.id}, function(err, product) {
        res.render('addproduct', {
            id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category_id
        });
    });
});

// @route POST /products/:id/edit-product
Router.post('/:id/edit-product', 
    ensureAuthenticated,
    upload.single('image'), 
    (req, res) => {
        // Check validation
        const {errors, isValid} = validateProduct(req.body);
        if(!isValid){
            return res.render('addproduct', {
                errors: errors,
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                image: req.body.image,
                category: req.body.category
            });
        }

        var query = {_id: req.params.id};
        var newvalues = { $set: 
                            {   
                                name: req.body.name,
                                description: req.body.description,
                                category_id: req.body.category,
                                price: req.body.price,
                                image: req.file.path
                            } 
                        };
        Product.updateOne(query, newvalues, function(err, product) {
            if(err) throw err;
            req.flash('success_msg', 'Product updated!');
            res.redirect('/products')
        });   
    }
);

// Delete product
Router.get('/:id/delete-product', ensureAuthenticated, (req, res) => {
    Product.updateOne({_id: req.params.id}, 
        {$set: {deleted: true}},
        function(err, prod) {
            req.flash('success_msg', 'Product deleted!');
            res.redirect('/products');
    });
});

// Add product to cart
Router.get('/:id/add-to-cart', (req, res, next) => {
    if(req.user) {
        Cart.updateOne({user: req.user._id}, {
            $push: {
                products: req.params.id
            }
        }, {upsert: true}, function(err, cart) {
            req.flash('success_msg', 'Item added to cart!')
            res.redirect('/products');
        });
    } else {
        res.redirect('/users/login');
    }
});

// Remove product from cart
Router.get('/:id/remove-from-cart', (req, res, next) => {
    if(req.user) {
        Cart.updateOne({user: req.user._id},
            {$pull: { 'products': req.params.id } },
            function(err, cart) {
            req.flash('success_msg', 'Item removed from cart!')
            res.redirect('/products/cart');
        });
    } else {
        res.redirect('/users/login');
    }
});


module.exports = Router;
