const mongoose = require('mongoose');

const whiteListSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "error, type a valid email"]
    },
    accessToken: {
        type: String,
        required: [true, "token is missing"]
    },
    refreshToken: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('WL', whiteListSchema);