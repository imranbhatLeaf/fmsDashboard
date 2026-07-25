const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // "READ_PII" | "WRITE_PII"
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: "Record", required: true },
    fieldsAccessing: [{ type: String, required: true }], // "pan_number", "aadhaar_number"
    accessedBy: { type: String, default: "payee" },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
