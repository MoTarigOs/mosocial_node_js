const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"],
        minLength: 2,
        maxLength: 25
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email address is already taken"],
        minLength: 5,
        maxLength: 100
    },
    password: {
        type: String,
        required: [true, "password is required"],
        minLength: 8,
        maxLength: 100
    },
    oauth: {
        type: Boolean,
        required: [true, "Error try again later"]
    },
    is_admin_role: {
        type: Boolean,
        default: false
    },
    is_owner_role: {
        type: Boolean,
        default: false
    },
    blocked: {
        date_of_block: {type: Number},
        block_duration: {type: Number}
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);