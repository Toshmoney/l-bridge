import express from "express";
import { isLoggin } from "../middleware/Authenticate";
const { createDocument, getSingleDocument, getUserDocuments } = require ("../controller/documents");
const router = express.Router();

router.route("/")
    .post(isLoggin, createDocument)
    .get(isLoggin, getUserDocuments);

router.route("/:id")
    .get(isLoggin, getSingleDocument);


module.exports = router;
