const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('../../../Models/User');
const User_Verification = require('../../../Models/User_Verification');

const router = express.Router();

router.post('/updatepassword', async (req, res) => {
    try {
        let { email, newpassword } = req.body;
        let phoneNumber = "", registeredUser = "", nonVerifiedUser = "";

        if (!validator.isEmail(email)) {
            phoneNumber = email;
            email = "";
        };

        if (email) registeredUser = await User.findOne({ email }).lean();
        else registeredUser = await User.findOne({ phoneNumber }).lean();

        if (!registeredUser)
            return res.status(401).json({ message: "Your account could not be found. Please create a new account.", successful: false });

        if (email) nonVerifiedUser = await User_Verification.findOne({ email }).lean();
        else nonVerifiedUser = await User_Verification.findOne({ phoneNumber }).lean();

        if (!nonVerifiedUser.permissionToResetPassword)
            return res.status(401).json({ message: "Unauthorized access detected", successful: false });

            
        const password = await bcrypt.hash(newpassword, 10);
        if(email){
            User.updateOne({ email }, { password }, (err) => {
                if (err) return res.status(400).json({ message: 'Your password could not be updated. Please try again', successful: false });
            });
        }
        else{
            User.updateOne({ phoneNumber }, { password }, (err) => {
                if (err) return res.status(400).json({ message: 'Your password could not be updated. Please try again', successful: false });
            });
        }

        // eslint-disable-next-line no-unused-vars
        User_Verification.findOneAndDelete({ email: nonVerifiedUser.email, phoneNumber: nonVerifiedUser.phoneNumber }, (err, done) => {});

        return res.status(201).json({ message: 'Your password was successfully updated', successful: true, email });

    } catch (e) {
        res.status(500).json({ message: "Internal server error, Sorry for inconvenience", successful: false });
    }
})

module.exports = router;