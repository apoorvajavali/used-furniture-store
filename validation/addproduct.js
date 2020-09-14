const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateProduct(data) {
    let errors = {};
    
    data.name = !isEmpty(data.name) ? data.name : '';
    data.description = !isEmpty(data.description) ? data.description : '';
    data.price = !isEmpty(data.price) ? data.price : '';
    
    if(!Validator.isLength(data.name, {min: 2, max: 30})){
        errors.name = 'Name must be between 2 and 30 characters';
    }

    if(Validator.isEmpty(data.name)){
        errors.name = 'Name field is required';
    }

    if(Validator.isEmpty(data.description)){
        errors.description = 'Description field is required';
    }

    if(Validator.isEmpty(data.price)){
        errors.price = 'Price is required';
    }

    if(!Validator.isNumeric(data.price)){
        errors.price = 'Price must be numeric';
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};