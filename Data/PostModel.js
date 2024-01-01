const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    creator_image: { type: String },
    creator_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "id is required"],
        unique: true
    },
    creator_username: {
        type: String,
        required: [true, "username is required"],
        unique: true
    },
    post_images: [{ 
        picturesNames: { type: String }
    }],
    desc: { type: String, max: 150 },
    likes: { type: Number }
}, { timestamps: true }).index({name: 'text', 'desc': 'text'});

module.exports = mongoose.model('Post', postSchema);