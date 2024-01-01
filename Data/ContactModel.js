const mongoose = require('mongoose');

const contactSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "token error"]
    },
    contact_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "url error"]
    },
    contact_image: {
        type: String
    },
    contact_username: {
        type: String,
        required: [true, "url error"]
    },
    new_messages: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);