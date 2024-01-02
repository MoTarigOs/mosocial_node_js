const express = require('express')
const router = express.Router();
const verifyJWT = require("../Middleware/VerifyJWT.JS");
const LogEvents = require("../Middleware/LogEvents");
const { 
    makeAdmin, deletePostAdmin, deleteCommentAdmin, blockUserAdmin, 
    unBlockUserAdmin, getBlockedUsersAdmin, removeAdmin, 
    getAdminsActivities, deleteAdminsActivity, createActivity, 
    getAdminChat, deleteChat, getAdmins, 
    getDeletedPics, getCombinedLog, getExceptionsLog
} = require('../Controllers/AdminController');
const { getReports, deleteReport } = require('../Controllers/ReportController');
const {checkBlockedUsers} = require('../Middleware/CheckBlockedUser');
const { csrfProtection } = require('../Controllers/UserController');

router.use(LogEvents);

router.get("/deleted-posts-pics/:secret", getDeletedPics);

router.get("/combined-logs/:secret", getCombinedLog);

router.get("/exceptions-logs/:secret", getExceptionsLog);

router.use(verifyJWT);
router.use(csrfProtection);
router.use(checkBlockedUsers);

router.post("/make_admin", makeAdmin);

router.post("/delete/post/:post_id", deletePostAdmin);

router.post("/delete/comment/:comment_id", deleteCommentAdmin);

router.post("/delete/message/:message_id", deleteChat);

router.post("/block_user/:user_id", blockUserAdmin);

router.post("/un-block-user/:user_id", unBlockUserAdmin);

router.get("/blocked-users/:limit", getBlockedUsersAdmin);

router.delete("/remove-admin/:admin_id", removeAdmin);

router.get("/admins/:limit", getAdmins);

router.get("/admins-activity/:limit/:type", getAdminsActivities);

router.delete("/admins-activity/:activity_id", deleteAdminsActivity);

router.post("/admins-activity/:activity_object_id", createActivity);

router.get("/reports/:limit", getReports);

router.delete("/reports/:report_id", deleteReport);

router.get("/chat/:chat_id", getAdminChat);

module.exports = router;