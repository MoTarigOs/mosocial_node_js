const express = require("express");
const router = express.Router();
const verifyJWT = require("../Middleware/VerifyJWT.JS");
const { createComment, deleteComment, getComments, getTopComment, getRandomComments, getComment } = require("../Controllers/CommentsController");
const LogEvents = require("../Middleware/LogEvents");
const {checkBlockedUsers} = require("../Middleware/CheckBlockedUser");
const { csrfProtection } = require("../Controllers/UserController");

router.use(verifyJWT);  
router.use(checkBlockedUsers);  

router.route("/top_comment/:post_id")
    .get(getTopComment)  

router.use(LogEvents);

router.route("/my_posts_comments/:num_of_fetches")
    .get(getRandomComments)   

router.route("/admin_comment/:comment_id")
    .get(getComment) 

router.route("/:post_id/:limit")
    .post(csrfProtection, createComment)
    .get(getComments)

router.route("/:comment_id")
    .delete(deleteComment)      

module.exports = router;