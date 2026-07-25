const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "registrar"] },
    sessionToken: { type: String, default: null } // Used to ensure single session
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
