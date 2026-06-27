const { sendEmail } = require("../utils/mailer");
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const Record = require("../models/Record");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Flat 10% TDS deducted from every record. Change this single value if the rate changes.
const TDS_RATE = 0.10;

// Maps loose/real-world CSV spellings to the exact enum value stored in Mongo.
// "TA/DA" is the one most likely to show up inconsistently across exports.
const CATEGORY_MAP = {
  honorarium: "Honorarium",
  salary: "Salary",
  fellowship: "Fellowship",
  "ta/da": "TA/DA",
  "ta-da": "TA/DA",
  tada: "TA/DA",
  refund: "Refund",
};

function normalizeCategory(raw) {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "");
  return CATEGORY_MAP[key] || null;
}

const ALLOWED_SERVICES = ["ASSSR", "VMI", "DHC", "JASSSR"];

function normalizeService(raw) {
  if (!raw) return null;
  const key = raw.trim().toUpperCase();
  return ALLOWED_SERVICES.includes(key) ? key : null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }
  if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
    return res.status(400).json({ message: "File must be a .csv" });
  }

  const validDocs = [];
  const errors = [];
  let rowNumber = 1; // row 1 = header line, so the first data row is row 2

  try {
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csv())
        .on("data", (row) => {
          rowNumber++;

          const name = row.name?.trim();
          const email = row.email?.trim().toLowerCase();
          const amount = Number(row.amount);
          const category = normalizeCategory(row.category);
          const services = normalizeService(row.services);

          if (!name) {
            errors.push({ row: rowNumber, reason: "Missing name" });
            return;
          }
          if (!email || !isValidEmail(email)) {
            errors.push({ row: rowNumber, reason: `Invalid email: "${row.email}"` });
            return;
          }
          if (Number.isNaN(amount)) {
            errors.push({ row: rowNumber, reason: `Invalid amount: "${row.amount}"` });
            return;
          }
          if (!category) {
            errors.push({
              row: rowNumber,
              reason: `Unrecognized category: "${row.category}"`,
            });
            return;
          }
          if (!services) {
            errors.push({
              row: rowNumber,
              reason: `Unrecognized service: "${row.services}" (must be ASSSR, VMI, DHC, or JASSSR)`,
            });
            return;
          }

          const amountAfterTds = Math.round(amount * (1 - TDS_RATE) * 100) / 100;

          validDocs.push({ name, email, amount, amountAfterTds, category, services });
        })
        .on("end", resolve)
        .on("error", reject);
    });
  } catch (err) {
    return res.status(400).json({ message: "Couldn't parse the CSV file.", detail: err.message });
  }

  let insertedCount = 0;
  try {
    if (validDocs.length > 0) {
      // ordered: false lets the batch keep going even if one document fails to insert
      const inserted = await Record.insertMany(validDocs, { ordered: false });
      insertedCount = inserted.length;
	 for (const doc of inserted) {
  try {
    await sendEmail(doc);
    await Record.findByIdAndUpdate(doc._id, {
      emailSent: true,
      emailSentAt: new Date(),
    });
  } catch (err) {
    await Record.findByIdAndUpdate(doc._id, { error: err.message });
  }
}

    }
  } catch (err) {
    return res.status(500).json({
      message: "Some records failed to save to the database.",
      detail: err.message,
      errors,
    });
  }

  res.json({ insertedCount, errors });
});

module.exports = router;
