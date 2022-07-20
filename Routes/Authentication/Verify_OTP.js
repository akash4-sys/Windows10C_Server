const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('../../Models/User');
const User_Verification = require('../../Models/User_Verification');
const { accessToken, refreshToken, initializeRefreshToken } = require('../../Utils/authHelper');

const router = express.Router();

router.post('/verify_otp', async (req, res) => {
    try {

        let { email, otp, resetPassword } = req.body;
        let phoneNumber = "", nonVerifiedUser = "";

        if (!validator.isEmail(email)) {
            phoneNumber = email;
            email = "";
        };

        if (email) nonVerifiedUser = await User_Verification.findOne({ email }).lean();
        else nonVerifiedUser = await User_Verification.findOne({ phoneNumber }).lean();

        if (!nonVerifiedUser) return res.status(410).json({ message: "Incorrect OTP, or either your OTP expired", successful: false });

        if (nonVerifiedUser.times_verified > 3)
            return res.status(400).json({ message: "You have hit the OTP verification limit. Please try after some time.", successful: false });

        let times_verified = nonVerifiedUser.times_verified + 1;
        if(email){
            User_Verification.updateOne({ email }, {times_verified}, (err) => {
                if (err) res.status(409).json({ created: false, message: "Something went wrong. Please try again later." });
            });
        }
        else{
            User_Verification.updateOne({ phoneNumber }, {times_verified}, (err) => {
                if (err) res.status(409).json({ created: false, message: "Something went wrong. Please try again later." });
            });
        }

        let correctOTP = await bcrypt.compare(otp, nonVerifiedUser.OTP);
        if (!correctOTP) return res.status(410).json({ message: "Incorrect OTP, or either your OTP expired", successful: false });

        if(resetPassword){
            if(email){
                User_Verification.updateOne({ email }, {permissionToResetPassword:true}, (err) => {
                    if (err) res.status(409).json({ created: false, message: "Something went wrong. Please try again later." });
                });
            }else{
                User_Verification.updateOne({ phoneNumber }, {permissionToResetPassword:true}, (err) => {
                    if (err) res.status(409).json({ created: false, message: "Something went wrong. Please try again later." });
                });
            }
            return res.status(200).json({ message: 'OTP successfully verified. Please enter your new password and confirm.', successful: true });
        }

        User_Verification.findOneAndDelete({ email: nonVerifiedUser.email, phoneNumber: nonVerifiedUser.phoneNumber }, (err, done) => {
            if (err) return res.status(409).json({ message: "The verification process could not be completed successfully.", successful: false });
        });

        User.create({ username: nonVerifiedUser.username, email, password: nonVerifiedUser.password, hint: nonVerifiedUser.hint, phoneNumber });

        const access_Token = accessToken(nonVerifiedUser._id);
        const refresh_Token = refreshToken(nonVerifiedUser._id);
        initializeRefreshToken(nonVerifiedUser._id);

        return res.status(201).json({ message: 'User succesfully registered', successful: true, access_Token, refresh_Token });

    } catch (err) {
        res.status(500).json({ message: "Internal server error, Sorry for inconvenience", successful: false });
    }
});

module.exports = router;