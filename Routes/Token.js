const router = require('express').Router();
const RefreshToken = require('../Models/RefreshTokens');
const { accessToken, refreshToken } = require('../Utils/authHelper');
const { verifyAccessToken, verifyRefreshToken } = require('../Middleware/authenticate');

router.get('/secureRoute', verifyAccessToken, (req, res) => {
    res.status(200).json({ message: "Your are authorized to access", securedConnection: true });
});

router.get('/session', verifyRefreshToken, async (req, res) => {
    console.log("session called")
    try {
        let userID = req.user.userId;
        let token = req.headers.authorization.split(" ")[1];
        console.log(userID, token)

        const refreshTokenExists = await RefreshToken.findOne({ userID, invalidRefreshTokens: token }).lean();
        if (refreshTokenExists) {
            RefreshToken.findOneAndDelete({ userID }, (err, done) => {
                if (err) return res.status(401).json({ message: "The authentication is invalid", securedConnection: false });
            });
            return res.status(401).json({ message: "Invalid Request", securedConnection: false });
        }
        else RefreshToken.updateOne({ userID }, { $push: { invalidRefreshTokens: [token] } }, (err, done) => {
            if (err) res.status(401).json({ message: "Invalid Request", securedConnection: false });
        });

        const access_Token = accessToken(userID);
        const refresh_Token = refreshToken(userID);

        res.status(200).json({
            message: "Your are authorized to access",
            securedConnection: true, access_Token, refresh_Token
        });

    } catch (e) {
        res.status(500).json({ message: "Internal server error, Sorry for inconvenience", created: false });
    }
});

module.exports = router;