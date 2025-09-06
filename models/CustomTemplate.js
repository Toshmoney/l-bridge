const mongoose = require("mongoose");

const customTemplateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    fields: {
      type: [String], // ["partyA", "partyB", "agreementDate"]
      required: true,
    },
    content: {
      type: String, // e.g. "This agreement is made between {{partyA}} and {{partyB}}..."
      required: true,
    },
    visibility: {
      type: String,
      enum: ["private", "public"], // private = only user, public = platform-wide
      default: "private",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomTemplate", customTemplateSchema);


