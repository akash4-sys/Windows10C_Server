const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    email: {
        type: String,
        default: "",
        unique: true, 
        sparse: true
    },
    password: String,
    hint: String,
    phoneNumber: {
        type:Number,
        default:"", 
        unique: true, 
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;