const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('../../Models/User');
const { accessToken, refreshToken, initializeRefreshToken } = require('../../Utils/authHelper');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {

        let { email, password } = req.body;
        let phoneNumber = "", userDetails = "";

        if (!validator.isEmail(email)) {
            phoneNumber = email;
            email = "";
        };

        if (email) userDetails = await User.findOne({ email }).lean();
        else userDetails = await User.findOne({ phoneNumber }).lean();

        if (!userDetails) return res.status(401).json({ message: 'Incorrect Email or Password, Please try again', successful: false })
        const matched = await bcrypt.compare(password, userDetails.password);
        if (!matched) return res.status(401).json({ message: 'Incorrect Email or Password, Please try again', successful: false })

        const access_Token = accessToken(userDetails._id);
        const refresh_Token = refreshToken(userDetails._id);
        initializeRefreshToken(userDetails._id);

        let userData = { username: userDetails.username, email: userDetails.email || "No email registered" };
        res.status(200).json({ message: 'Login succesful', successful: true, access_Token, userData, refresh_Token });

    } catch (err) {
        res.status(500).json({ message: "Internal server error, Sorry for inconvenience", successful: false });
    }

})

module.exports = router;