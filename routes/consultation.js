const express = require("express");
const { bookConsultation, getConsultations, getLawyerConsultations, getLawyerConsultationById, getConsultationById } = require("../controller/lawyer");
const { isLoggin, isAdmin } = require("../middleware/Authenticate");

const router = express.Router();


router.route("/")
  .post(isLoggin, bookConsultation)
  .get(isLoggin, getConsultations);


router.route("single/:id")
  .get(isLoggin, getConsultationById);


router.route("/lawyer")
  .get(isLoggin, getLawyerConsultations);
router.route("/lawyer/:id")
  .get(isLoggin, getLawyerConsultationById);


module.exports = router;
