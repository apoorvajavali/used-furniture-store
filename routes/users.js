const express = require('express');
const Router = express.Router();
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');
const passport = require('passport');

// Load Input Validation
const validateRegistration = require('../validation/register');

// Load User model
const User = require('../models/User');

// @route GET api/users
// @desc Retrieve users
// @access Public
Router.get('/login', (req, res) => {
    res.render('login');
});


Router.get('/register', (req, res) => {
    res.render('register');
});

// @route POST api/users/register
// @desc Register user
// @access Public
Router.post('/register', (req, res) => {
    // Check validation
    const {errors, isValid} = validateRegistration(req.body);
  
    if(!isValid){
        return res.render('register', {
            errors: errors,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2
        });
    }

    User.findOne({email: req.body.email}).then(user => {
            if(user){
                errors.email = 'Email already exists!';
                return res.render('register', {
                    errors: errors,
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                    password2: req.body.password2
                });
            } else {
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => {
                                req.flash('success_msg', 'You are now registered! Login to continue.');
                                res.redirect('/users/login');
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
});


// @route POST api/users/login
// @desc Login user /Returning JWT Token
// @access Public
Router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/products',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// @route POST api/users/current
// @desc Return curent user
// @access Private
Router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
    });
});

Router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/users/login');
})

module.exports = Router;
