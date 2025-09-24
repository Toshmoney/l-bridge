const Document = require( "../models/Document");
const PDFDocument = require ("pdfkit");
const path = require("path");
const fs = require("fs");
const templates = require("../templates/documentTemplates");
const { fillTemplate } = require("../utils/templateEngine");
const {
  Document: WordDoc,
 Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} = require("docx");
const CustomTemplate = require("../models/CustomTemplate");
const { log } = require("console");


// Create new document
const createDocument = async (req, res) => {
  try {
    const { title, templateType, fields, templateMode } = req.body;

    let template;
    let content;
    let customTemplate;


    if (templateMode === "system") {
      // 🟢 System templates
      if (!templates[templateType]) {
        return res.status(400).json({ message: "Invalid template type" });
      }
      template = templates[templateType];
      content = fillTemplate(template.content, fields);

    } else if (templateMode === "custom") {
      // 🟢 Custom templates (from DB)
      customTemplate = await CustomTemplate.findById(req.body.customTemplateId);

      console.log("Custom Template:", customTemplate);

      if (!customTemplate) {
        return res.status(404).json({ message: "Custom template not found" });
      }

      template = customTemplate;
      content = fillTemplate(customTemplate.content, fields);
    } else {
      return res.status(400).json({ message: "Invalid template mode" });
    }

    // Save document
    const document = await Document.create({
      user: req.user.userId,
      title: title || template.title,
      templateType: customTemplate ? customTemplate.templateType : templateType,
      fields,
      content,
      status: "completed",
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("Create Document Error:", error);
    res.status(500).json({ message: error.message });
  }
};


const downloadDocumentPDF = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.user.toString() !== req.user.userId.toString()) {
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

    // Header₦
    doc.fontSize(20).text(document.title, { align: "center" });
    doc.moveDown();

    // Content
    doc.fontSize(12).text(document.content, {
      align: "justify",
      lineGap: 6,
      align: "center"
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
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Download document as Word (.docx)
const downloadDocumentWord = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.user.toString() !== req.user.userId.toString()) {
      return res.status(404).json({ message: "Document not found" });
    }

    const fileName = `${document.title.replace(/\s+/g, "_")}_${document._id}.docx`;
    const filePath = path.resolve(`./tmp/${fileName}`);
    if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");

    // Split content into paragraphs
    const paragraphs = document.content.split("\n").map((line) => {
      return new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 200 },
      });
    });

    // Create Word document
  const wordDoc = new WordDoc({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5"
        },
        // ✅ Force white background
        background: {
          color: "FFFFFF", 
        },
      },
      children: [
        // Header
        new Paragraph({
          text: document.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "", spacing: { after: 120 } }),

        // Content
        ...paragraphs,

        new Paragraph({ text: "", spacing: { after: 240 } }),

        // Signatures block
        new Paragraph({
          text: "Signatures",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: "", spacing: { after: 120 } }),

        // new Table({
        //   width: { size: 100, type: WidthType.PERCENTAGE },
        //   rows: [
        //     new TableRow({
        //       children: [
        //         new TableCell({
        //           width: { size: 50, type: WidthType.PERCENTAGE },
        //           children: [
        //             new Paragraph("Employer:"),
        //             new Paragraph(""),
        //             new Paragraph("________________________"),
        //             new Paragraph("Name & Signature"),
        //           ],
        //         }),
        //         new TableCell({
        //           width: { size: 50, type: WidthType.PERCENTAGE },
        //           children: [
        //             new Paragraph("Employee:"),
        //             new Paragraph(""),
        //             new Paragraph("________________________"),
        //             new Paragraph("Name & Signature"),
        //           ],
        //         }),
        //       ],
        //     }),
        //   ],
        // }),

        new Paragraph({ text: "", spacing: { after: 240 } }),

        // Footer
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `Generated on: ${new Date(document.createdAt).toLocaleDateString()}`,
              italics: true,
              size: 20,
            }),
          ],
        }),
      ],
    },
  ],
});

    const buffer = await Packer.toBuffer(wordDoc);
    fs.writeFileSync(filePath, buffer);

    res.download(filePath, fileName, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all documents for logged-in user
const getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.userId }).sort({ createdAt: -1 }).populate("user", "name email _id");
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single document
const getSingleDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.user.toString() !== req.user.userId.toString()) {
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



module.exports = { createDocument, getUserDocuments, getSingleDocument, downloadDocumentPDF, getTemplates, getTemplateByType, downloadDocumentWord };