const Admin = require('../Data/AdminModel');
const asyncHandler = require('express-async-handler');
const { sendToEmail } = require('../Logic/helperMethods');
const { default: mongoose } = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const User = require('../Data/UserModel');
const Post = require('../Data/PostModel');
const Comment = require('../Data/CommentModel');
const AdminActivity = require('../Data/AdminActivityModel');
const Chat = require('../Data/ChatModel');
const { isValidText } = require('../Logic/Checker');

const activitiesNames = ["delete post", "delete comment", "delete message", "block user", "un-block user", "remove admin"];
const moderatesNames = ["moderate post", "moderate profile"];

const makeAdmin = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.body) return res.status(403).send("login to your account");

    const { id, email, username } = req.user;

    const { reason, choosenEmail } = req.body;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(403).send("please login to your account");

    const user = await User.findOne({ _id: id });

    if(!user) return res.status(403).send("please login or create an account");

    if(user.is_admin_role === true || user.is_owner_role === true) return res.status(403).send("you are already an admin");

    const checkAlreadyAdmin = await Admin.findOne({admin_user_id: id, admin_email: email});
    
    if(checkAlreadyAdmin) return res.status(403).send("you are already an admin");

    const msg = `<h2>Username:<h1>${username}</h1></h2><h2>Email:<h1>${email}</h1></h2><h2>Choosen email:<h1>${choosenEmail}</h1></h2><h2>Reason:<p>${reason}<p></h2>`;

    const sendEmailRes = await sendToEmail(msg, process.env.PERSONAL_EMAIL, process.env.GMAIL_ACCOUNT, process.env.GMAIL_APP_PASSWORD);

    if(!sendEmailRes) return res.status(500).send("We encounters an error, please try again later");

    res.status(200).send("we will response to you as soon as possible");

});

const deletePostAdmin = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params || !req.body) return res.status(403).send("please login to your account");

    const { reason } = req.body;

    if(!reason || reason.length <= 0 || !isValidText(reason)) return res.status(400).send("please write a reason for deleting this post");

    const { id, email, username } = req.user;
    
    if(!id || !mongoose.Types.ObjectId.isValid(id) || !email || email.length <= 0) 
        return res.status(403).send("please login to your account");

    const { post_id } = req.params;

    if(!post_id || !mongoose.Types.ObjectId.isValid(post_id)) 
        return res.status(403).send("no post specified");

    const admin = await Admin.findOne({ admin_user_id: id, admin_email: email });
    
    if(!admin) return res.status(403).send("please login to your account");

    if(admin.deletion_objects_ids.length >= admin.allowed_num_of_deletion) 
        return res.status(403).send("seem like you deleted a lot of things, please contact the owner to let you continue deleting");

    const deletedPost = await Post.deleteOne({ _id: post_id });

    if(deletedPost.deleteCount <= 0) return res.status(501).send("Error in the server please try again later");

    const deletedComments = await Comment.deleteMany({ post_id: post_id });

    const obj = {deleted_object_id: post_id, reason: reason};

    const updatedAdmin = await Admin.updateOne({ admin_user_id: id, admin_email: email }, { $push: { deletion_objects_ids: obj }});

    const updateAdminActivity = await AdminActivity.create({
        admin_user_id: id,
        admin_email: email,
        admin_username: username,
        activity_name: "delete post",
        activity_object_id: post_id,
        reason: reason
    });

    res.status(200).send("Post deleted successfully");

});

const deleteCommentAdmin = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params || !req.body) return res.status(403).send("please login to your account");

    const { reason } = req.body;

    if(!reason || reason.length <= 0 || !isValidText(reason)) return res.status(400).send("please write a reason for deleting this post");

    const { id, email, username } = req.user;
    
    if(!id || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(403).send("please login to your account");

    const { comment_id } = req.params;

    if(!comment_id || !mongoose.Types.ObjectId.isValid(comment_id)) 
        return res.status(403).send("no post specified");

    const admin = await Admin.findOne({ admin_user_id: id });
    
    if(!admin) return res.status(403).send("please login to your account");

    if(admin.deletion_objects_ids.length >= admin.allowed_num_of_deletion) 
        return res.status(403).send("seem like you deleted a lot of things, please contact the owner to let you continue deleting");

    const deletedComment = await Comment.deleteOne({ _id: comment_id });

    if(deletedComment.deleteCount <= 0) return res.status(501).send("Error in the server please try again later");

    const obj = {deleted_object_id: comment_id, reason: reason};

    const updatedAdmin = await Admin.updateOne({ admin_user_id: id, admin_email: email }, { $push: { deletion_objects_ids: obj }});

    const updateAdminActivity = await AdminActivity.create({
        admin_user_id: id,
        admin_email: email,
        admin_username: username,
        activity_name: "delete comment",
        activity_object_id: comment_id,
        reason: reason
    });

    res.status(200).send("Comment deleted successfully");

});

const deleteChat = asyncHandler( async(req, res) => {

    if(!req?.params?.message_id || !req?.user?.id || !req?.body)
        return res.status(403).json({ message: "please include valid inputs" });

    const adminId = req.user.id;
    const { senderId, reason } = req.body;
    const messageId = req.params.message_id;

    if(!mongoose.Types.ObjectId.isValid(adminId)) return res.status(403).json({ message: "You are not allowed to do this operation" });    

    if(!mongoose.Types.ObjectId.isValid(senderId)) return res.status(403).json({ message: "Error try again later" });  

    if(!mongoose.Types.ObjectId.isValid(messageId)) return res.status(404).json({ message: "No message found" });
    
    const admin = await Admin.findOne({ admin_user_id: adminId });
    
    if(!admin) return res.status(403).send("please login to your account");

    if(admin.deletion_objects_ids.length >= admin.allowed_num_of_deletion) 
        return res.status(403).send("seem like you deleted a lot of things, please contact the owner to let you continue deleting");

    const deletedChat = await Chat.deleteOne({ _id: messageId, sender_id: senderId });

    if(!deletedChat?.deletedCount > 0)
        return res.status(403).json({ message: "Error deleting message" });

    const obj = { deleted_object_id: messageId, reason: reason };

    const updatedAdmin = await Admin.updateOne({ admin_user_id: adminId }, { $push: { deletion_objects_ids: obj }});

    const updateAdminActivity = await AdminActivity.create({
        admin_user_id: adminId,
        admin_email: req.user.email,
        admin_username: req.user.username,
        activity_name: "delete message",
        activity_object_id: messageId,
        reason: isValidText(reason) ? reason : "No reason wrote"
    });
        
    res.status(200).send("Message deleted successfully");    

});

const blockUserAdmin = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params || !req.body) return res.status(403).send("please login to your account");

    const { reason, blockDuration } = req.body;

    console.log("reason: ", reason, " duration: ", blockDuration);

    if(!isValidText(reason) || typeof blockDuration !== "number" || blockDuration <= 0) return res.status(400).send("please write a reason for blocking this user");

    const { id, email, username } = req.user;
    
    if(!id || !mongoose.Types.ObjectId.isValid(id) || !email || email.length <= 0) 
        return res.status(403).send("please login to your account");

    const { user_id } = req.params;

    if(!user_id || !mongoose.Types.ObjectId.isValid(user_id)) 
        return res.status(403).send("no user specified");

    const admin = await Admin.findOne({ admin_user_id: id });
    
    if(!admin) return res.status(403).send("please login to your account");

    if(admin.blocked_users_ids.length >= admin.allowed_num_of_blocks) 
        return res.status(403).send("seem like you blocked a lot of users, please contact the owner to let you continue blocking");

    const blockObj = {date_of_block: Date.now(), block_duration: blockDuration};

    const updatedUser = await User.findOneAndUpdate({ _id: user_id }, { blocked: blockObj, isBlocked: true });

    if(!updatedUser) return res.status(404).send("user not found");

    let alreadyBlockedByTHisAdmin = false;
    const array = admin.blocked_users_ids;
    for (let i = 0; i < array.length; i++) {
        if(array[i].blocked_user_id === user_id)
            alreadyBlockedByTHisAdmin = true;
    }

    if(alreadyBlockedByTHisAdmin) return res.status(200).send("User blocked successfully");

    const obj = {blocked_user_id: user_id, reason: reason};

    const updatedAdmin = await Admin.updateOne({ admin_user_id: id, admin_email: email }, { $push: { blocked_users_ids: obj } });

    const updateAdminActivity = await AdminActivity.create({
        admin_user_id: id,
        admin_email: email,
        admin_username: username,
        activity_name: "block user",
        activity_object_id: user_id,
        reason: reason
    });

    res.status(201).send("User blocked successfully");

});

const unBlockUserAdmin = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params) return res.status(403).send("please login to your account");

    const { id, email, username } = req.user;
    
    if(!id || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(403).send("please login to your account");

    const { user_id } = req.params;

    if(!user_id || !mongoose.Types.ObjectId.isValid(user_id)) 
        return res.status(403).send("no user specified");

    const admin = await Admin.findOne({ admin_user_id: id });
    
    if(!admin) return res.status(403).send("please login to your account");

    const blockObj = {date_of_block: null, block_duration: null};

    const updatedUser = await User.findOneAndUpdate({ _id: user_id }, { blocked: blockObj, isBlocked: false });

    if(!updatedUser) return res.status(404).send("user not found");

    const obj = {blocked_user_id: user_id};

    const updatedAdmin = await Admin.updateOne({ admin_user_id: id }, { $pull: { blocked_users_ids: obj }});

    const updateAdminActivity = await AdminActivity.create({
        admin_user_id: id,
        admin_email: email,
        admin_username: username,
        activity_name: "un-block user",
        activity_object_id: user_id,
        reason: ""
    });

    res.status(201).send("User un-blocked successfully");

});

const getBlockedUsersAdmin = asyncHandler(async(req, res) => {

    if(!req || !req.user) return res.status(403).send("please login to your account");

    const { id } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(403).send("please login to your account");

    const admin = await Admin.findOne({ admin_user_id: id });
    
    if(!admin) return res.status(403).send("please login to your account");

    let { limit } = req.params;

    if(!limit || limit <= 0 || typeof limit !== "number") limit = 100;

    if(limit > 100) limit = 100;

    const blockedUsers = await User.find({ isBlocked: true }).limit(limit);

    if(!blockedUsers) return res.status(404).send("No blocked users found");

    if(blockedUsers.length <= 0) return res.status(200).json([]);

    let ids = [];

    for (let i = 0; i < blockedUsers.length; i++) {
        ids.push(blockedUsers[i]._id);
    };

    console.log("ids: ", ids);

    const reasons = await Admin.find({ 'blocked_users_ids.blocked_user_id': ids }).select('blocked_users_ids admin_user_id admin_username');

    console.log("admin blocks: ", reasons);

    let arr = [];

    for (let i = 0; i < blockedUsers.length; i++) {

        let reason = "";
        let adminId = "";
        let adminUsername = "";

        for (let i = 0; i < reasons.length; i++) {

            for (let j = 0; j < reasons[i].blocked_users_ids.length; j++) {

                const element = reasons[i].blocked_users_ids[j];

                if(element.blocked_user_id.toString() === blockedUsers[i]._id.toString()) {
                    reason = element.reason;
                    adminId = reasons[i].admin_user_id;
                    adminUsername = reasons[i].admin_username;
                    break;
                }
            }
        }

        arr.push({
            blockedUserId: blockedUsers[i]._id,
            blockedUsername: blockedUsers[i].username,
            dateOfUnBlock: blockedUsers[i].blocked.date_of_block + blockedUsers[i].blocked.block_duration,
            reason: reason,
            adminId,
            adminUsername
        });
    }

    res.status(200).json(arr);

});

const removeAdmin = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params) return res.status(403).send("please login to your account");

    const { id, email, username } = req.user;

    let { admin_id } = req.params;

    if(!id || !mongoose.Types.ObjectId.isValid(id) || !email || email.length <= 0) 
        return res.status(403).send("please login to your account");

    if(!admin_id || !mongoose.Types.ObjectId.isValid(admin_id)) 
        return res.status(403).send("no admin selected");

    const isOwnerLevel = await User.findOne({ _id: id, is_owner_role: true });    

    if(!isOwnerLevel) return res.status(403).send("you are not allowed to remove an admin");

    const admins = await Admin.find({ admin_user_id: [id, admin_id] });
    
    let adminIds = [];

    for (let i = 0; i < admins.length; i++) {
        adminIds.push(admins[i].admin_user_id);
    };

    if(!adminIds.find(id)) return res.status(403).send("You are not allowed to remove an admin");

    if(!adminIds.find(admin_id)) return res.status(403).send("This user is not an Admin");

    const removedAdmin = await Admin.deleteOne({ admin_user_id: admin_id });

    if(!removedAdmin || removedAdmin.deleteCount <= 0) return res.status(501).send("Error occured when removing this admin");

    await User.findOneAndUpdate({ _id: admin_id, is_admin_role: true }, { is_admin_role: false });

    const updateAdminActivity = await AdminActivity.create({
        admin_user_id: id,
        admin_email: email,
        admin_username: username,
        activity_name: "remove admin",
        activity_object_id: admin_id,
        reason: ""
    });

    res.status(200).send("Succeeded! This user is not an Admin anymore");

});

const getAdminsActivities = asyncHandler(async(req, res) => {

    if(!req || !req.user) return res.status(403).send("please login to your account");

    const { id } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(403).send("please login to your account");

    let { limit, type } = req.params ? req.params : { limit: 50, type: null };

    if(!limit || limit <= 0) limit = 100;

    if(limit > 1000) limit = 1000;

    const admins = await Admin.findOne({ admin_user_id: id });

    if(!admins) return res.status(403).send("please login to your account");

    const activities = await AdminActivity.find({ activity_name: type === "moderates" ? moderatesNames : activitiesNames }).sort({ createdAt: -1 }).limit(limit);

    res.status(200).json(activities);

});

const getAdmins = asyncHandler(async(req, res) => {

    if(!req || !req.user) return res.status(403).send("please login to your account");

    const { id } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(403).send("please login to your account");

    let { limit } = req.params ? req.params : { limit: 20 };

    if(!limit || typeof limit !== "number" || limit <= 0) limit = 20;

    if(limit > 100) limit = 100;

    const admin = await Admin.findOne({ admin_user_id: id });

    if(!admin) return res.status(403).send("please login to your account");

    const admins = await Admin.find().limit(limit);

    res.status(200).json(admins);

});

const deleteAdminsActivity = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params) return res.status(403).send("please login to your account");

    const { id } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(403).send("please login to your account");

    let { activity_id } = req.params;

    if(!activity_id || !mongoose.Types.ObjectId.isValid(activity_id)) 
        return res.status(404).send("no activity found");

    const admins = await Admin.findOne({ admin_user_id: id });

    if(!admins) return res.status(403).send("please login to your account");

    const deletedActivity = await AdminActivity.deleteOne({ _id: activity_id });

    if(deletedActivity.deleteCount <= 0) return res.status(501).send("Error deleting the activity");

    res.status(200).send("Successfully deleted the activity");

});

const createActivity = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params || !req.body?.type) return res.status(403).send("please login to your account");

    const { id, email } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id) || !email || email.length <= 0) 
        return res.status(403).send("please login to your account");

    let { activity_object_id } = req.params;

    if(!activity_object_id || !mongoose.Types.ObjectId.isValid(activity_object_id)) 
        return res.status(404).send("no activity found");

    const { type } = req.body;

    if(type !== "moderate post" && type !== "moderate profile") return res.status(400).send("bad url");    

    const updateAdminActivity = await AdminActivity.create({
        admin_user_id: null,
        admin_email: null,
        admin_username: null,
        activity_name: type,
        activity_object_id: activity_object_id,
        reason: null
    });

    if(!updateAdminActivity) return res.status(500).send("Error occured while sending the post to admins page");

    res.status(201).send(`Successfully sent the ${type} to the moderates queue`);

});

const getAdminChat = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.params) return res.status(403).send("please login to your account");

    const { id, email } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id) || !email || email.length <= 0) 
        return res.status(403).send("please login to your account");

    let { chat_id } = req.params;

    if(!chat_id || !mongoose.Types.ObjectId.isValid(chat_id)) 
        return res.status(404).send("no message found");

    const admins = await Admin.findOne({ admin_user_id: id });

    if(!admins) return res.status(403).send("please login to your account");    

    const msg = await Chat.findOne({ _id: chat_id });

    if(!msg) return res.status(500).send("Error occured while finding the message");

    res.status(200).send(msg);

});

const getDeletedPics = asyncHandler( async(req, res) => {

    if(!req || !req.params) return res.status(403).json({ message: "Error in the url" });

    const { secret } = req.params;

    if(!secret || secret !== process.env.LOG_OWNER_SECRET) return res.status(400).json({ message: "You are not allowed to get info" });

    const file = (await fs.readFile(path.join(__dirname, "..", "Log", "DeleteCloudPics.log"))).toString();

    res.status(200).json(file);

});

const getCombinedLog = asyncHandler( async(req, res) => {

    if(!req || !req.params) return res.status(403).json({ message: "Error in the url" });

    const { secret } = req.params;

    if(!secret || secret !== process.env.LOG_OWNER_SECRET) return res.status(400).json({ message: "You are not allowed to get info" });

    const file = (await fs.readFile(path.join(__dirname, "..", "Log", "combined.log"))).toString();

    res.status(200).json(file);

});

const getExceptionsLog = asyncHandler( async(req, res) => {

    if(!req || !req.params) return res.status(403).json({ message: "Error in the url" });

    const { secret } = req.params;

    if(!secret || secret !== process.env.LOG_OWNER_SECRET) return res.status(400).json({ message: "You are not allowed to get info" });

    const file = (await fs.readFile(path.join(__dirname, "..", "Log", "exceptions.log"))).toString();

    res.status(200).json(file);

});

module.exports = {
    makeAdmin, deletePostAdmin, deleteCommentAdmin, blockUserAdmin, 
    unBlockUserAdmin, getBlockedUsersAdmin, removeAdmin, getAdminsActivities,
    deleteAdminsActivity, createActivity, getAdminChat, deleteChat, getAdmins,
    getDeletedPics, getCombinedLog, getExceptionsLog
}