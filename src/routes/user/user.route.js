const express = require("express");
const router = express.Router();
const user_controller = require("./user.controller");
// const auth = require("../../middleware/auth");
const uploadMiddleWare = require("../../middleware/fileUpload");

router.post(
  "/fileUpload",
  uploadMiddleWare.single("file"),
  user_controller.fileUpload
);

router.post("/signup", user_controller.createUser);
router.post("/login", user_controller.loginUser);
router.post("/otp-less", user_controller.sendOTP);
router.post("/login-otp", user_controller.loginWithPhone);
router.get("/user/:id", user_controller.getUser)
router.post("/verifyOTP-less", user_controller.verifyOTP);

module.exports = router;
