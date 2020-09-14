const mongoose = require('mongoose');

// DB config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
const client = mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true} )
                       .then(console.log('MongoDB Connected'))
                       .catch(err => console.log(err));

module.exports = client;