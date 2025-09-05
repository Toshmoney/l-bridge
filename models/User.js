const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String,
      required: true,
      unique: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
  password: { type: String, required: true },
  role: { type: String, enum: ["client", "lawyer", "admin"], default: "client" },
  subscription: {
    plan: { type: String, default: "Free" },
    expiresAt: { type: Date },
  },
  profilePicture: {type: String},
  profileDescription: {type: String},
  resetToken: String,
  resetExpires: Date,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;