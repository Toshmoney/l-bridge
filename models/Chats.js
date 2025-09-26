const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date, default: null }, 
});

module.exports = mongoose.model("Chat", chatSchema);
