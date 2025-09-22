const express = require("express");
const {
  verifyPurchase,
  getWallet,
} = require("../controller/lawyer");
const { isLoggin, isAdmin } = require("../middleware/Authenticate");

const router = express.Router();

  
router.route("/wallet").get(isLoggin, getWallet);




module.exports = router;
