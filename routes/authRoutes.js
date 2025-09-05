const express = require("express");
const { login,
  register,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logout,
  profile,
  updateProfile,
  changePassword,
  getPublicProfile
} = require("../controller/auth");
const { isLoggin, isAdmin } = require("../middleware/Authenticate");
const router = express.Router();

router.route("/reset-password")
  .post(requestPasswordReset)
  .put(resetPassword);

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/logout").post(logout);
router.route("/profile")
  .get(isLoggin, profile)
  .patch(isLoggin, updateProfile)

router.route("/change-password").post(changePassword);
router.route("/user").get(getPublicProfile);

module.exports = router;