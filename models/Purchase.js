const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "CustomTemplate", required: true },
    amount: { type: Number, required: true },
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: ["success", "failed"], default: "success" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
