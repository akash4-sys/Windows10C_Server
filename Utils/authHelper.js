const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const User_Verification = require('../Models/User_Verification');
const RefreshToken = require('../Models/RefreshTokens');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

module.exports = {
    accessToken: (userId) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    },

    refreshToken: (userId) => {
        return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
    },

    setNewOTP: ({ email, OTP, password, hint, times_resended, phoneNumber }) => {
        if (email) User_Verification.updateOne({ email }, { OTP, password, hint, times_resended }, (err) => { if (err) return true; });
        else User_Verification.updateOne({ phoneNumber }, { OTP, password, hint, times_resended }, (err) => { if (err) return true; });
    },

    initializeRefreshToken: async (userID) => {
        const userExists = await RefreshToken.findOne({ userID }).lean();
        if (userExists) await RefreshToken.deleteOne({ userID })
        else RefreshToken.create({ userID, invalidRefreshTokens: [""] });
    },

    sendOtpToEmail: async ({ email, OTP, username }) => {
        const html = require('./Email')({ username, OTP });
        let transporter = nodemailer.createTransport(nodemailerSendgrid({ apiKey: process.env.SENDGRID_API_KEY }));
        let mailOptions = {
            from: process.env.COMPANY_EMAIL_ID, to: email, subject: 'Verify your account', text: "This is a account verification email.", html
        };
        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (err) { return false; }
    },

    sendOtpToPhone: async ({ phoneNumber, OTP }) => {
        try {
            await client.messages.create({
                body: `Dear customer, Your Windows 10 Chrome verification code is: ${OTP}`,
                from: process.env.TWILIO_NUMBER,
                to: phoneNumber
            })
            return true;
        } catch (e) {
            if (e.code === 21408) return -1;
            return 0;
        }
    },

    resetOTP: ({ email, times_resended,  OTP, phoneNumber }) => {
        if (email) User_Verification.updateOne({ email }, { times_resended, OTP }, (err) => { if (err) return true; });
        else User_Verification.updateOne({ phoneNumber }, { times_resended, OTP }, (err) => { if (err) return true; });
    },

    updateResetPassword: ({ email, times_reseted, OTP, phoneNumber }) => {
        if (email) User_Verification.updateOne({ email }, { times_reseted, OTP }, (err) => { if (err) return true; });
        else User_Verification.updateOne({ phoneNumber }, { times_reseted, OTP }, (err) => { if (err) return true; });
    },
};