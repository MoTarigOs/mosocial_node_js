const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    post_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "error in url"],
        unique: true
    },
    commenter_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "id is required"]
    },
    commenter_image: { type: String },
    commenter_name: { 
        type: String,
        required: [true, "username is required"] 
    },
    comment_text: {
        type: String,
        required: [true, "type something :("]
    }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);