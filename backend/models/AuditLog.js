const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: "Record" },
    fieldsAccessing: [{ type: String }],
    accessedBy: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
