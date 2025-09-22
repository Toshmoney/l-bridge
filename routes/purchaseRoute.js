const express = require("express");
const {
  verifyPurchase,
} = require("../controller/lawyer");
const { isLoggin, isAdmin } = require("../middleware/Authenticate");

const router = express.Router();

  
router.route("/purchase-template/verify").post(isLoggin, verifyPurchase);




module.exports = router;
