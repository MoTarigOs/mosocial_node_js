const mongoose = require('mongoose');

const profileSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "please enter valid email"],
        max: 36,
        min: 3
    },
    username: {
        type: String,
        required: [true, "username is required"],
        unique: [true, "this username already taken"],
        max: 25,
        min: 1
    },
    user_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "user_id is required"]
    },
    postsLiked: [{
        post_liked_id: {type: String}
    }],
    profileImage: {type: String, default: ""},
    introInfo: {
        introParagraph: {type: String, max: 200},
        smallDetails: [{
            title: {type: String, max: 25},
            value: {type: String, max: 75}
        }]
    },
    detailedInfo: {
        paragraph: {type: String},
        skills: [{
            name: {type: String, max: 100},
            percentage: {type: Number, min: 0, max: 100}
        }]
    },
    contacts: [{
        name_of_app: {
            type: String,
            required: [true, "name of app is required for security reasons"]
        },
        url: {type: String},
    }],
    notification: [{
        notif_sender_username: {type: String},
        notif_sender_id: {type: mongoose.Schema.ObjectId }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);