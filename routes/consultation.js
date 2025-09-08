const express = require("express");
const { bookConsultation, getConsultations } = require("../controller/lawyer");
const { isLoggin, isAdmin } = require("../middleware/Authenticate");

const router = express.Router();


router.route("/")
  .post(isLoggin, bookConsultation)
  .get(isLoggin, getConsultations);


module.exports = router;
