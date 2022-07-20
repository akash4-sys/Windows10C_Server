const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('../../Models/User');
const User_Verification = require('../../Models/User_Verification');
const { setNewOTP, sendOtpToEmail, sendOtpToPhone } = require('../../Utils/authHelper');

const router = express.Router();

router.post('/create_account', async (req, res) => {
    try {

        let { username, password, email, hint } = req.body;
        let phoneNumber = "", existingUser = "";

        const OTP = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        const otpStr = OTP + "";
        const encrypted_OTP = await bcrypt.hash(otpStr, 10);
        const encrypted_Password = await bcrypt.hash(password, 10);

        if (!validator.isEmail(email)) {
            phoneNumber = email;
            email = "";
        };

        if (email) {
            let registeredUser = await User.findOne({ email }).lean();
            if (registeredUser) return res.status(409).json({ created: false, message: "A account is already registered with this email." });

            existingUser = await User_Verification.findOne({ email }).lean();
            
            if (existingUser){
                if((existingUser.times_resended + 1) > 3)
                    return res.status(400).json({ created: false,
                        message: "You have tried too many times to register your account. Please try after some time"
                    });
                let err = setNewOTP({
                    email, OTP: encrypted_OTP, password: encrypted_Password, hint, times_resended: existingUser.times_resended + 1
                });
                if (err) res.status(409).json({ created: false, message: "New OTP could not be generated. Please try again." });
            }

            let emailSent = await sendOtpToEmail({ email, OTP, username });
            if (!emailSent) return res.status(424).json({ created: false, message: "Failed to send OTP, Please try after some time." });
        }
        else {
            let registeredUser = await User.findOne({ phoneNumber }).lean();
            if (registeredUser)
                return res.status(409).json({ created: false, message: "A account is already registered with this phone number." });

            existingUser = await User_Verification.findOne({ phoneNumber }).lean();

            if (existingUser) {
                if((existingUser.times_resended + 1) > 3)
                    return res.status(400).json({ created: false, 
                        message: "You have tried to many times to register your account. Please try after some time"
                    });
                let err = setNewOTP({
                    phoneNumber, OTP: encrypted_OTP, password: encrypted_Password, hint, times_resended: existingUser.times_resended + 1
                });
                if (err) res.status(409).json({ created: false, message: "New OTP could not be generated. Please try again." });
            }

            let otpSentToNumber = await sendOtpToPhone({ phoneNumber, OTP });
            if (otpSentToNumber === 0) return res.status(424).json({ created: false, message: "Failed to send OTP, Please try after some time." });
            if (otpSentToNumber === -1) return res.status(400).json({
                created: false, message: "Please enter your country code before your phone number."
            });
        }

        if (!existingUser) {
            const data = await User_Verification.create({ username, email, password: encrypted_Password, OTP: encrypted_OTP, hint, phoneNumber });
            console.log(data)
        }
        console.log(OTP)
        return res.status(201).json({ created: true, message: "Please check your email or phone number for OTP." });
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: "Internal server error, Sorry for inconvenience", created: false });
    }
});

module.exports = router;