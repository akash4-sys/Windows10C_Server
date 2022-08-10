const mongoose = require('mongoose');

let MONGODB_URI = process.env.DEV_MONGODB_URI;
if(process.env.NODE_ENV == 'production')
    MONGODB_URI = process.env.PRODUCTION_MONGODB_URI

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connection Successful to database")
}).catch((err) => {
    console.log('Database Not Connected', err);
})