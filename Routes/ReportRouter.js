const express = require("express");
const router = express.Router();
const verifyJWT = require("../Middleware/VerifyJWT.JS");
const LogEvents = require("../Middleware/LogEvents");
const { report } = require("../Controllers/ReportController");
const checkBlockedUsers = require("../Middleware/CheckBlockedUser");
const { csrfProtection } = require("../Controllers/UserController");

router.use(verifyJWT);

router.use(LogEvents);

router.use(csrfProtection);

router.use(checkBlockedUsers);

router.route("/:report_type/:object_id")
    .post(report);

module.exports = router;