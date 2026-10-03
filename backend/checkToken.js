const mongoose = require("mongoose");
const Record = require("./models/Record");

const MONGO_URI = "mongodb://localhost:27017/fms";

async function checkToken() {
  await mongoose.connect(MONGO_URI);

  const token = "ASR2026001";
  const record = await Record.findOne({
    $or: [
      { token },
      { payee_link_token: token },
      { utr_rrn_reference_number: token }
    ]
  });

  if (!record) {
    console.log("❌ No record found for token:", token);
  } else {
    console.log("✅ Record found:");
    console.log("  _id:              ", record._id);
    console.log("  token:            ", record.token);
    console.log("  payee_link_token: ", record.payee_link_token);
    console.log("  utr_rrn_ref:      ", record.utr_rrn_reference_number);
    console.log("  payee_status:     ", record.payee_status);
    console.log("  formSubmitted:    ", record.formSubmitted);
    console.log("  expiresAt:        ", record.expiresAt);
    console.log("  createdAt:        ", record.createdAt);
    console.log("  rejected:         ", record.rejected);
    const age = Date.now() - new Date(record.createdAt).getTime();
    const ageDays = (age / (1000 * 60 * 60 * 24)).toFixed(1);
    console.log("  age (days):       ", ageDays);
    const isExpired = (record.expiresAt && new Date() > new Date(record.expiresAt)) ||
      age > 45 * 24 * 60 * 60 * 1000;
    console.log("  isExpired:        ", isExpired);
  }

  await mongoose.disconnect();
  process.exit(0);
}

checkToken().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
