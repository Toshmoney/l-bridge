const Document = require( "../models/Document");
const PDFDocument = require ("pdfkit");
const path = require("path");
const fs = require("fs");
const templates = require("../templates/documentTemplates");
const { fillTemplate } = require("../utils/templateEngine");


// Create new document
const createDocument = async (req, res) => {
  try {
    const { title, templateType, fields } = req.body;

    if (!templates[templateType]) {
      return res.status(400).json({ message: "Invalid template type" });
    }

    const template = templates[templateType];
    const content = fillTemplate(template.content, fields);

    const document = await Document.create({
      user: req.user._id,
      title: title || template.title,
      templateType,
      fields,
      content,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const downloadDocumentPDF = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Document not found" });
    }

    // PDF file name
    const fileName = `${document.title.replace(/\s+/g, "_")}_${document._id}.pdf`;
    const filePath = path.resolve(`./tmp/${fileName}`);

    // Ensure tmp dir exists
    if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");

    // Create PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text("MobiDocs - Legal Document", { align: "center" });
    doc.moveDown();

    // Title
    doc.fontSize(16).text(document.title, { underline: true });
    doc.moveDown();

    // Content
    doc.fontSize(12).text(document.content, {
      align: "justify",
      lineGap: 6,
    });

    // Footer
    doc.moveDown();
    doc.fontSize(10).text(
      `Generated on: ${new Date(document.createdAt).toLocaleDateString()}`,
      { align: "right" }
    );

    doc.end();

    // Send file when ready
    stream.on("finish", () => {
      res.download(filePath, fileName, (err) => {
        if (err) console.error("Download error:", err);
        fs.unlinkSync(filePath); // delete after sending
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all documents for logged-in user
const getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single document
const getSingleDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTemplates = async (req, res) => {
  try {
    const list = Object.keys(templates).map((key) => ({
      type: key,
      title: templates[key].title,
      fields: templates[key].fields,
    }));

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTemplateByType = async (req, res) => {
  try {
    const { type } = req.params;
    const template = templates[type];

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({
      type,
      title: template.title,
      fields: template.fields,
      sampleContent: template.content, // for preview
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = { createDocument, getUserDocuments, getSingleDocument, downloadDocumentPDF, getTemplates, getTemplateByType };