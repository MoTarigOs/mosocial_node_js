const express = require("express");
const router = express.Router();
const { sendMessage, getChats, deleteChat } = require("../Controllers/ChatController");
const LogEvents = require("../Middleware/LogEvents");
const {checkBlockedUsers} = require("../Middleware/CheckBlockedUser");
const { csrfProtection } = require("../Controllers/UserController");
const verifyJWT = require("../Middleware/VerifyJWT.JS");

router.use(verifyJWT);
router.use(checkBlockedUsers);

router.route("/:id")
    .get(getChats)

router.use(LogEvents);

router.route("/:id")
    .post(csrfProtection, sendMessage)

router.route("/:message_id")
    .delete(deleteChat)

module.exports = router;