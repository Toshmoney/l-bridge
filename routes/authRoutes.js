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
const upload = require("../utils/multer")
const router = express.Router();

router.route("/reset-password")
  .post(requestPasswordReset)
  .put(resetPassword);

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/logout").post(isLoggin, logout);
router.route("/profile")
  .get(isLoggin, profile)
  .patch(isLoggin, upload.single("profilePicture"), updateProfile)

router.route("/change-password").post(isLoggin, changePassword);
router.route("/user").get(getPublicProfile);

router.get("/verify-token", isLoggin, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

module.exports = router;