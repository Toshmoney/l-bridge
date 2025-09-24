const CustomTemplate = require("../models/CustomTemplate");
const Purchase = require("../models/Purchase");
// Create a new custom template
const createCustomTemplate = async (req, res) => {
  try {
    const { title, fields, content, visibility, templateType, price } = req.body;

    if (!title || !fields || !content || !templateType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if(!price){
      return res.status(400).json({message: "Template amount is required!"})
    }

    const template = await CustomTemplate.create({
      user: req.user.userId,
      title,
      fields,
      content,
      templateType,
      visibility: visibility || "private",
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all custom templates (public + user-owned)
const getCustomTemplates = async (req, res) => {
  try {
    const templates = await CustomTemplate.find({
      $or: [{ visibility: "public" }, { user: req.user._id }],
    }).populate("user", "name role");
    if (!templates || templates.length === 0) {
      return res.status(404).json({ message: "No templates found" });
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get only purchased templates for the client
const getPurchasedTemplates = async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.userId }).select("template");

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({
        message: "You've not bought any template, kindly visit the template market to buy now",
      });
    }

    const purchasedTemplateIds = purchases.map((p) => p.template);

    const templates = await CustomTemplate.find({
      _id: { $in: purchasedTemplateIds },
    }).populate("user", "name role");

    res.json(templates);
  } catch (error) {
    console.error("Get Purchased Templates Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// get user owned templates
const getUserOwnedCustomTemplates = async (req, res) => {
  try {
    const templates = await CustomTemplate.find({ user: req.user.userId }).populate("user", "name role");
    if (!templates || templates.length === 0) {
      return res.status(404).json({ message: "No templates found" });
    }
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get single custom template
const getCustomTemplateById = async (req, res) => {
  try {
    const template = await CustomTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Ensure access (public or owned by user)
    if (template.visibility === "private" && !template.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update custom template
const updateCustomTemplate = async (req, res) => {
  try {
    const template = await CustomTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (!template.user.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, fields, content, visibility } = req.body;
    if (title) template.title = title;
    if (fields) template.fields = fields;
    if (content) template.content = content;
    if (visibility) template.visibility = visibility;

    await template.save();

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete custom template
const deleteCustomTemplate = async (req, res) => {
  try {
    const template = await CustomTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (!template.user.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await template.deleteOne();
    res.json({ message: "Template deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createCustomTemplate,
  getUserOwnedCustomTemplates,
  getCustomTemplates,
  getCustomTemplateById,
  updateCustomTemplate,
  deleteCustomTemplate,
  getPurchasedTemplates
};