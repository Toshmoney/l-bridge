import express from "express";
const {getTemplates, getTemplateByType} = require("../controller/documents");
const { isLoggin } = require("../middleware/Authenticate");

const router = express.Router();

router.route("/")
    .get(isLoggin, getTemplates);
router.route("/:type")
    .get(isLoggin, getTemplateByType);


module.exports = router;