const jwt = require("jsonwebtoken");

module.exports = {
    verifyAccessToken: async (req, res, next) => {
        try {
            const token = await req.headers.authorization.split(" ")[1];
            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;
            next();
        } catch (e) {
            res.status(401).json({ message: "Invalid Request", securedConnection: false });
        }
    },
    verifyRefreshToken: async (req, res, next) => {
        try {
            const token = await req.headers.authorization.split(" ")[1];
            const user = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
            req.user = user;
            next();
        } catch (e) {
            res.status(401).json({ message: "Invalid Request", securedConnection: false });
        }
    }
}

// module.exports = async (req, res, next) => {
//     try{

//         const token = await req.headers.authorization.split(" ")[1];
//         const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
//         const user = await decodedToken;
//         req.user = user;
//         next();

//     }catch(e){
//         res.status(401).json({ message: "Invalid Request", loggedIn:false});
//     }
// }