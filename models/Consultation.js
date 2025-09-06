const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: "Lawyer", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  topic: { type: String, required: true },
  details: { type: String },
  scheduledAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Consultation = mongoose.model("Consultation", consultationSchema);

module.exports = Consultation;
