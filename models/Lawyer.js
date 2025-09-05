const mongoose = require("mongoose")
const lawyerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  specialization: [String],
  barCertificate: { type: String, required: true },
  verified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  consultations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Consultation" }]
}, { timestamps: true });

const Lawyer = mongoose.model("Lawyer", lawyerSchema);

module.exports = Lawyer;