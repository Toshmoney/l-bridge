const express = require ("express");
const {
  createCustomTemplate,
  getCustomTemplates,
  getCustomTemplateById,
  updateCustomTemplate,
  deleteCustomTemplate,
  getUserOwnedCustomTemplates
} = require ("../controller/customTemplateController.js");
const {isLoggin: protect} = require("../middleware/Authenticate.js");

const router = express.Router();

router.route("/")
  .post(protect, createCustomTemplate)
  .get(protect, getCustomTemplates);

router.route("/my-templates")
  .get(protect, getUserOwnedCustomTemplates);

router.route("/:id")
  .get(protect, getCustomTemplateById)
  .put(protect, updateCustomTemplate)
  .delete(protect, deleteCustomTemplate);

module.exports = router;
