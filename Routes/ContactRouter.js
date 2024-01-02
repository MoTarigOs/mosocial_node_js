const express = require("express");
const router = express.Router();
const verifyJWT = require("../Middleware/VerifyJWT.JS");
const { createContact, getContacts, deleteContact, updateContact } = require("../Controllers/ContactController");
const LogEvents = require("../Middleware/LogEvents");
const {checkBlockedUsers} = require("../Middleware/CheckBlockedUser");
const { csrfProtection } = require("../Controllers/UserController");

router.use(verifyJWT);
router.use(LogEvents);
router.use(csrfProtection);
router.use(checkBlockedUsers);

router.route("/")
    .get(getContacts)

router.route("/:id")
    .post(createContact)
    .patch(updateContact)
    .delete(deleteContact)

module.exports = router;