const express = require("express");
const router = express.Router();
const { registerUser, logUser, logOut, getUserInfo, 
    sendCodeToEmail, verifyEmail, deleteAccount, 
    changePasswordEmailCode, changePassword, csrfProtection } = require('../Controllers/UserController');
const verifyJWT = require("../Middleware/VerifyJWT.JS");
const { handleRefreshToken } = require("../Middleware/RefreshTokenHandler");
const LogEvents = require("../Middleware/LogEvents");

router.post("/register", LogEvents, registerUser);

router.post("/sendCodeToEmail", LogEvents, sendCodeToEmail);

router.post("/verifyEmail", LogEvents, verifyEmail);

router.use("/oauth", LogEvents, require('./OAuthRouter'));

router.post("/login", LogEvents, logUser);

router.post("/logout", verifyJWT, LogEvents, csrfProtection, logOut);

router.post("/refreshToken", LogEvents, csrfProtection, handleRefreshToken);

router.get("/get_user_info", verifyJWT, LogEvents, csrfProtection, getUserInfo);

router.delete("/delete_account", verifyJWT, LogEvents, csrfProtection, deleteAccount);

router.post("/send_code_new_password", LogEvents, csrfProtection, changePasswordEmailCode);

router.post("/make_new_password", LogEvents, csrfProtection, changePassword);

router.get("/test", csrfProtection, (req, res) => {
    res.cookie('csrf_token', req.csrfToken());
    res.status(200).json({ message: "Successfully get test router" });
});

router.post("/test", csrfProtection, (req, res) => {
    res.status(200).json({ message: "Successfully post test router" });
});

module.exports = router;