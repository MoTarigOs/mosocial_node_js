const mongoose = require('mongoose');

const ReportSchema = mongoose.Schema({
    report_type: {type: String},
    report_issue: {type: String},
    report_desc: {type: String},
    reporter_id: {type: mongoose.Schema.ObjectId},
    reporter_email: {type: String},
    reporter_username: {type: String},
    report_on_this_object_id: {type: mongoose.Schema.ObjectId},
    report_on_this_user_id: {type: String},
    report_on_this_username: {type: String},
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);