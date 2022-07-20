const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connection Successful to database")
}).catch((err) => {
    console.log('Database Not Connected', err);
})