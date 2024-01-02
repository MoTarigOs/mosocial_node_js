const express = require("express");
const router = express.Router();

router.use("/user", require("./UserRouter"));
router.use("/profile", require("./ProfileRouter"));
router.use("/post", require("./PostRouter"));
router.use("/comments", require("./CommentsRouter"));
router.use("/chat", require("./ChatRouter"));
router.use("/contacts", require("./ContactRouter"));
router.use("/report", require("./ReportRouter"));
router.use("/admin", require("./AdminRouter"));

module.exports = router;