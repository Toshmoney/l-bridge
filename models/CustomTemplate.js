const mongoose = require("mongoose");

const customTemplateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    fields: {
      type: [String], // e.g ["partyA", "partyB", "agreementDate"]
      required: true,
    },
    content: {
      type: String, // e.g. "This agreement is made between {{partyA}} and {{partyB}}..."
      required: true,
    },
    price: {
      type: Number,
      default: 0, // Free by default, can be set by admin later
    },
    visibility: {
      type: String,
      enum: ["private", "public"], // private = only user, public = platform-wide
      default: "private",
    },
    templateType: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomTemplate", customTemplateSchema);


