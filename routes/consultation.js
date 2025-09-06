const express = require("express");
const { bookConsultation } = require("../controller/lawyer");
const { isLoggin, isAdmin } = require("../middleware/Authenticate");

const router = express.Router();


router.route("/")
  .post(isLoggin, bookConsultation)
  .get(isLoggin, bookConsultation);


module.exports = router;
