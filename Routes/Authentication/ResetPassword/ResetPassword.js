const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('../../../Models/User');
const User_Verification = require('../../../Models/User_Verification');
const { sendOtpToEmail, sendOtpToPhone, updateResetPassword } = require('../../../Utils/authHelper');

const router = express.Router();

router.post('/resetpassword', async (req, res) => {
    try {
        let { email } = req.body;
        let phoneNumber = "", registeredUser = "", nonVerifiedUser = "";

        if (!validator.isEmail(email)) {
            phoneNumber = email;
            email = "";
        };

        if (email) registeredUser = await User.findOne({ email }).lean();
        else registeredUser = await User.findOne({ phoneNumber }).lean();

        if (!registeredUser)
            return res.status(401).json({ message: "Your account could not be found. Please create a new account.", successful: false });

        let { username, password, hint } = registeredUser;

        const OTP = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        const otpStr = OTP + "";
        const encrypted_OTP = await bcrypt.hash(otpStr, 10);
        console.log(OTP)

        if (email) nonVerifiedUser = await User_Verification.findOne({ email }).lean();
        else nonVerifiedUser = await User_Verification.findOne({ phoneNumber }).lean();

        if (nonVerifiedUser) {

            if ((nonVerifiedUser.times_reseted + 1) > 3)
                return res.status(400).json({
                    created: false,
                    message: "You have tried too many times to reset your password. Please try after some time."
                });

                
            let err = updateResetPassword({ email, phoneNumber, times_reseted: nonVerifiedUser.times_reseted + 1, OTP: encrypted_OTP });
            if (err) return res.status(409).json({ created: false, message: "Something went wrong. Please try again later." });

        }
        else User_Verification.create({ username, email, password, OTP: encrypted_OTP, hint, phoneNumber, times_reseted: 1 });

        if (email) {
            let emailSent = await sendOtpToEmail({ email, OTP, username: registeredUser.username });
            if (!emailSent) {
                let err = updateResetPassword({ email, phoneNumber, times_reseted: nonVerifiedUser.times_reseted, OTP: encrypted_OTP });
                if (err) {
                    return res.status(409).json({ created: false, message: "Something went wrong. Please try again later" })
                };
                return res.status(424).json({ successful: false, message: "Failed to send OTP, Please try after some time." })
            };
            return res.status(200).json({ successful: true, message: "A new email with your OTP has been sent to your registered email." });
        }
        else {
            let otpSentToNumber = await sendOtpToPhone({ phoneNumber, OTP });
            if(otpSentToNumber === 0 || otpSentToNumber === -1){
                let err = updateResetPassword({ email, phoneNumber, times_reseted: nonVerifiedUser.times_reseted, OTP: encrypted_OTP });
                if (err) {
                    return res.status(409).json({ created: false, message: "Something went wrong. Please try again later" })
                };
            }
            if (otpSentToNumber === 0) return res.status(424).json({ successful: false, message: "Failed to send OTP, Please try after some time." });
            if (otpSentToNumber === -1) return res.status(400).json({
                created: false, message: "Please enter your country code before your phone number."
            });
            return res.status(200).json({ successful: true, message: "A new message with your OTP has been sent to your registered phone number." });
        }

    } catch (err) {
        res.status(500).json({ message: "Internal server error, Sorry for inconvenience", successful: false });
    }
});

module.exports = router;