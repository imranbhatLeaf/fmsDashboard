require("dotenv").config();
const mongoose = require("mongoose");
const Record = require("./models/Record");

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fms")
  .then(async () => {
    try {
      const result = await Record.deleteMany({
        $or: [
          { bankReferenceNo: "ASR2026001" },
          { utr_rrn_reference_number: "ASR2026001" },
          { receiptNumber: "ASR2026001" }
        ]
      });
      console.log(`Deleted ${result.deletedCount} record(s).`);
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  });
