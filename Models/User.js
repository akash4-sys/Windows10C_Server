const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    email: {
        type: String,
        default: ""
    },
    password: String,
    hint: String,
    phoneNumber: {
        type:Number,
        default:""
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;