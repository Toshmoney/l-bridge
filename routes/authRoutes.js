const express = require("express");
const { login, register, requestPasswordReset, resetPassword, refreshAccessToken, logout } = require("../controller/auth");
const router = express.Router();

router.route("/reset-password")
  .post(requestPasswordReset)
  .put(resetPassword);

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/logout").post(logout);

module.exports = router;