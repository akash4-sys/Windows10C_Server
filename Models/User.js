const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    email: {
        type:String,
        unique:true,
        partialFilterExpression: {
            $exists:true
        }
    },
    hint: String,
    phoneNumber:{
        type:Number,
        unique: true,
        partialFilterExpression:{
            $exists:true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;