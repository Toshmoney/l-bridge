const express = require("express");
const {
  registerLawyer,
  getLawyers,
  getLawyerById,
  verifyLawyer,
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



module.exports = router;
