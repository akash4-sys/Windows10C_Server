const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User_Verification = require('../../Models/User_Verification');
const { sendOtpToEmail, sendOtpToPhone, resetOTP } = require('../../Utils/authHelper');

const router = express.Router();

router.post('/resendOtp', async (req, res) => {
    try{
        let { email } = req.body;
        let phoneNumber = "", nonVerifiedUser = "";

        if (!validator.isEmail(email)) {
            phoneNumber = email;
            email = "";
        };

        if (email) nonVerifiedUser = await User_Verification.findOne({ email }).lean();
        else nonVerifiedUser = await User_Verification.findOne({ phoneNumber }).lean();

        if (!nonVerifiedUser) return res.status(401).json({ message: "You are unauthorized to access this page.", successful: false });

        if (nonVerifiedUser.times_resended >= 3)
            return res.status(400).json({ message: "You have hit the OTP resending limit. Please try after some time.", successful: false });

        let times_resended = nonVerifiedUser.times_resended + 1;
        const OTP = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        const otpStr = OTP + "";
        const encrypted_OTP = await bcrypt.hash(otpStr, 10);

        console.log(OTP)

        if (email) {
            let err = resetOTP({ email, times_resended, OTP: encrypted_OTP });
            if (err) res.status(409).json({ created: false, message: "Something went wrong. Please try again later." });
            let emailSent = await sendOtpToEmail({email, OTP, username:nonVerifiedUser.username});
            if(!emailSent) return res.status(424).json({ successful: false, message: "Failed to send OTP, Please try after some time." });
            return res.status(200).json({ successful:true, message: "A new email with your OTP has been sent to your registered email." });
        }
        else {
            let err = resetOTP({ phoneNumber, times_resended, OTP: encrypted_OTP });
            if (err) res.status(409).json({ created: false, message: "Something went wrong. Please try again later." });
            let otpSentToNumber = await sendOtpToPhone({phoneNumber, OTP});
            if(otpSentToNumber === 0) return res.status(424).json({ successful: false, message: "Failed to send OTP, Please try after some time." });
            return res.status(200).json({ successful:true, message: "A new message with your OTP has been sent to your registered phone number." });
        }

    } catch (err) {
        res.status(500).json({ message: "Internal server error, Sorry for inconvenience", successful: false });
    }
});

module.exports = router