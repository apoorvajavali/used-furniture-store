const express = require('express');
const Router = express.Router();

const Category = require('../models/Category');


Router.get('/', (req, res) => {
    res.send('categories');
});

Router.post('/', (req, res) => {

    const newCategory = new Category({
        name: req.body.name,
        id: req.body.id
    });
    newCategory.save()
        .then(product => res.json(product))
        .catch(err => console.log(err));
})


module.exports = Router;