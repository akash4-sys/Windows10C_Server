const mongoose = require('mongoose');

const userVerificationSchema = mongoose.Schema({
    username:String,
    email:{
        type:String,
        unique: true, 
        sparse: true
    },
    password:String,
    hint:String,
    phoneNumber:{
        type:Number,
        unique: true, 
        sparse: true
    },
    OTP:String,
    permissionToResetPassword:{
        type:Boolean,
        default:false
    },
    times_verified:{
        type:Number,
        default:0
    },
    times_resended:{
        type:Number,
        default:0
    },
    times_reseted:{
        type:Number,
        default:0
    },
    isVerified:{
        type:Boolean,
        default:false,
        index:false
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        index: {
            expires: '570s',
            partialFilterExpression: {isVerified:false}
        }
    }
});

const User_Verification = mongoose.model('User_Verification', userVerificationSchema);
module.exports = User_Verification;