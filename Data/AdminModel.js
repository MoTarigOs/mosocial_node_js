const mongoose = require('mongoose');

const AdminSchema = mongoose.Schema({
    admin_user_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "token error"],
        unique: [true, "you are already an Admin"]
    },
    admin_email: {
        type: String,
        required: [true, "login to your account"],
        unique: [true, "Email not found, try again"]
    },
    admin_username: {
        type: String
    },
    deletion_objects_ids: [{
        deleted_object_id: {type: mongoose.Schema.ObjectId},
        reason: {type: String}
    }],
    blocked_users_ids: [{
        blocked_user_id: {type: mongoose.Schema.ObjectId},
        reason: {type: String}
    }],
    allowed_num_of_deletion: {
        type: Number,
        default: 50
    },
    allowed_num_of_blocks: {
        type: Number,
        default: 25
    }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);