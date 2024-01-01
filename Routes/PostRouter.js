const express = require("express");
const router = express.Router();
const verifyJWT = require("../Middleware/VerifyJWT");
const { createPost, getAllPostsByID, getPosts, likePost, removeLikePost, deletePost, getPostDetails } = require("../Controllers/PostController");
const LogEvents = require("../Middleware/LogEvents");
const checkBlockedUsers = require("../Middleware/CheckBlockedUser");
const { csrfProtection } = require("../Controllers/UserController");

router.use(verifyJWT);
router.use(LogEvents);
router.use(csrfProtection);
router.use(checkBlockedUsers);

router.route("/")
    .post(createPost)

router.route("/:limit/:filter/:contactsFilter/:filterText")    
    .get(getPosts)

router.route("/single-post/:post_id")    
    .get(getPostDetails)

router.route("/:id/:limit/:filter")
    .get(getAllPostsByID)
    
router.route("/like/:id")
    .patch(likePost)
    .delete(removeLikePost)

router.route("/:post_id")
    .delete(deletePost)    

module.exports = router;