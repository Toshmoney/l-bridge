const express = require("express");
const { login, register, requestPasswordReset, resetPassword } = require("../controller/auth");
const router = express.Router();

router.route("/reset-password")
  .post(requestPasswordReset)
  .put(resetPassword);

router.route("/register").post(register);
router.route("/login").post(login);

module.exports = router;