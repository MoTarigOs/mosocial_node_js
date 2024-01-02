const express = require("express");
const router = express.Router();
const verifyJWT = require("../Middleware/VerifyJWT.JS");
const { updateProfile, getProfile, updateProfileFailedPic, getMyProfile, clearNotification } = require("../Controllers/ProfileController");
const LogEvents = require("../Middleware/LogEvents");
const {checkBlockedUsers} = require("../Middleware/CheckBlockedUser");
const { csrfProtection } = require("../Controllers/UserController");

router.use(verifyJWT);
router.use(LogEvents);
router.use(checkBlockedUsers);

router.route("/")
    .post(csrfProtection, updateProfile)
    .get(getMyProfile)
    .put(clearNotification)

router.route('/:user_id')    
    .get(getProfile)  

router.route('/pic_upload_failed')
    .put(csrfProtection, updateProfileFailedPic);    

module.exports = router;