const mongoose = require("mongoose");
const documentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  templateType: { type: String, required: true },
  fields: { type: Object, required: true },
  content: { type: String, required: true }, 
  status: { type: String, enum: ["draft", "completed"], default: "draft" },
}, { timestamps: true });

module.exports = mongoose.model("Document", documentSchema);