const express = require("express");
const router = express.Router();


router.use("/google", require('../Logic/OAuth/OAuthGoogle'));

module.exports = router;