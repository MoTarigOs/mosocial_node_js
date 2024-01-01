const asyncHandler = require('express-async-handler');
const Report = require('../Data/ReportModel');
const Admin = require('../Data/AdminModel');
const { default: mongoose } = require('mongoose');
const { isValidText, isValidUsername } = require('../Logic/Checker');
const { escapeHtmlandJS } = require('../Logic/helperMethods');

const reportsTypes = ["profile", "comment", "post", "chat", "unspecified"];

const report = asyncHandler(async(req, res) => {

    if(!req?.body || !req?.params) return res.status(403).send("Error occured please try again later");

    const { 
        issue, desc, hisUserID, hisUserUsername
    } = req.body;

    if((!issue || issue.length <= 0) && (!desc || desc.length <= 0)) return res.status(403).send("No enough explanation of the problem");

    if(!isValidUsername(hisUserUsername) || !mongoose.Types.ObjectId.isValid(hisUserID))
        return res.status(403).send("Not valid inputs");

    let { report_type, object_id } = req.params;

    if(object_id && object_id !== 'x' && !mongoose.Types.ObjectId.isValid(object_id)) return res.status(403).send("Wrong inputs");

    const { id, username, email } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(403).send("Wrong inputs");

    if(!report_type || report_type.length <= 0 || report_type === 'x' || !isValidText(report_type)) report_type = "unspecified";

    const rp = await Report.create({
        report_type: report_type.toLowerCase(),
        report_issue: escapeHtmlandJS(issue),
        report_desc: escapeHtmlandJS(desc),
        reporter_id: id,
        reporter_email: email,
        reporter_username: username,
        report_on_this_object_id: (object_id && object_id !== 'x') ? object_id : null,
        report_on_this_user_id: hisUserID,
        report_on_this_username: hisUserUsername
    });

    if(!rp) return res.status(500).send("Error on our behalf, please try report again");

    res.status(201).send("reported successfully");

});

const getReports = asyncHandler(async(req, res) => {

    if(!req || !req.user) return res.status(403).send("please login to your account");

    const { id, email } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id) || !email || email.length <= 0) 
        return res.status(403).send("please login to your account");

    let { limit } = req.params ? req.params : { limit: 50 };

    if(!limit || typeof limit !== "number" || limit <= 0) limit = 10;

    if(limit > 100) limit = 100;

    const admins = await Admin.findOne({ admin_user_id: id });

    if(!admins) return res.status(403).send("please login to your account");

    const reports = await Report.find({ report_type: reportsTypes }).sort({ createdAt: 1 }).limit(limit);

    for (let i = 0; i < reports.length; i++) {
        reports[i].report_type = reports[i].report_type.toLowerCase();
    };

    res.status(200).json(reports);

});

const deleteReport = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params) return res.status(403).send("please login to your account");

    const { id, email } = req.user;

    let { report_id } = req.params;

    if(!id || !mongoose.Types.ObjectId.isValid(id) || !email || email.length <= 0) 
        return res.status(403).send("please login to your account");

    if(!report_id || !mongoose.Types.ObjectId.isValid(report_id)) 
        return res.status(404).send("No report found");

    const admins = await Admin.findOne({ admin_user_id: id });

    if(!admins) return res.status(403).send("please login to your account");

    const deletedReport = await Report.deleteOne({ _id: report_id });

    if(deletedReport.deleteCount <= 0) return res.status(400).send("no reports found");

    res.status(200).send("Report deleted successfully");

});

module.exports = { report, getReports, deleteReport };