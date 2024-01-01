const mongoose = require('mongoose');

const AdminActivitySchema = mongoose.Schema({
    admin_user_id: {
        type: mongoose.Schema.ObjectId
    },
    admin_email: {
        type: String
    },
    admin_username: {
        type: String
    },
    activity_name: {
        type: String
    },
    activity_object_id:{
        type: mongoose.Schema.ObjectId
    },
    reason:{
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminActivity', AdminActivitySchema);