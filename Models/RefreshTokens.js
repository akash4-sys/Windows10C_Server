const mongoose = require('mongoose');

const refreshTokenSchema = mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true,
    },
    invalidRefreshTokens: [{
        type:String,
        index: { expires: '1500s' }
    }],
    createdAt:{
        type:Date,
        default:Date.now(),
    }
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
module.exports = RefreshToken;