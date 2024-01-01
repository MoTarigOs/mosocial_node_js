const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "token error"]
    },
    receiver_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "url error"]
    },
    sender_username: {
        type: String,
        required: [true, "username is required"]
    },
    chat_text: { 
        type: String,
        required: [true, "text can't be empty"]
    }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);