const express = require ("express");
const { isLoggin } = require ("../middleware/Authenticate");
const { createDocument, getSingleDocument, getUserDocuments, downloadDocumentPDF, downloadDocumentWord } = require ("../controller/documents");
const router = express.Router();

router.route("/")
    .post(isLoggin, createDocument)
    .get(isLoggin, getUserDocuments);

router.route("/:id")
    .get(isLoggin, getSingleDocument);

router.route("/download-pdf/:id")
    .get(isLoggin, downloadDocumentPDF);

router.route("/download-word/:id")
    .get(isLoggin, downloadDocumentWord);


module.exports = router;
