const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const connet = await mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING);
        console.log(
            "Database connected",
            connet.connection.host,
            connet.connection.name
        );
    } catch(err){
        console.log(err);
    }
}

module.exports = connectDB;