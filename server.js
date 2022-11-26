const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

if (process.env.NODE_ENV == "production") 
    dotenv.config({ path: './config.env' });
else
    dotenv.config({ path: './Config/config.env' });

require('./Config/Database');

const PORT = process.env.PORT || 80;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

const whitelist = process.env.WHITELISTED_DOMAINS ? process.env.WHITELISTED_DOMAINS.split(",") : []

const corsOptions = {
    origin: function (origin, callback) {
        if(!origin || whitelist.indexOf(origin) !== -1){
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials:true
}

app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.status(200).send('Congratz your are now connected to windows 10 Chrome server');
});

app.use('/auth', require('./Routes/Authentication/CreateAccount'));
app.use('/auth', require('./Routes/Authentication/Login'));
app.use('/auth', require('./Routes/Authentication/Verify_OTP'));
app.use('/auth', require('./Routes/Authentication/ResendOTP'));
app.use('/auth', require('./Routes/Authentication/ResetPassword/ResetPassword'));
app.use('/auth', require('./Routes/Authentication/ResetPassword/UpdatePassword'));
app.use('/token', require('./Routes/Token'));

app.get('*', (req, res) => {
    res.status(404).send('Url not found');
});

app.listen(PORT, () => {
    console.log(`Server is running`);
});