const express = require("express");
const {
  registerLawyer,
  getLawyers,
  getLawyerById,
  verifyLawyer,
  verifyPurchase,
} = require("../controller/lawyer");
const { isLoggin, isAdmin } = require("../middleware/Authenticate");

const router = express.Router();

// register a lawyer
router.route("/")
  .post(isLoggin, registerLawyer) 
  .get(getLawyers);

router.route("/:id")
  .get(getLawyerById);

router.route("/:id/verify")
  .patch(isLoggin, isAdmin, verifyLawyer);
  
router.route("/purchase-template/verify")
    .post(isLoggin, verifyPurchase);




module.exports = router;
