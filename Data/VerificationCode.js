const mongoose = require('mongoose');

const VerCodeSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "error, type a valid email"]
    },
    code: {
        type: String,
        maxlength: 6,
        minlength: 6
    },
    date: {
        type: Number,
        required: [true, "Error in our server"]
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('VerCode', VerCodeSchema);