const crypto = require("crypto");
const { sendEmail } = require("../utils/mailer");
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const Record = require("../models/Record");
const { requireAuth, requireRole } = require("../utils/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function generateUtrn(component, offset = 0) {
  const comp = (component || "ASSSR").toUpperCase();
  const prefixMap = { ASSSR: "ASR", VMI: "VMI", DHC: "DHC", JASSSR: "JAS" };
  const shortPrefix = prefixMap[comp] || comp.substring(0, 3);
  const year = new Date().getFullYear();
  const prefix = `${shortPrefix}${year}`;

  const count = await Record.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });

  const seq = String(count + offset + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

// Flat 10% TDS deducted from every record. Change this single value if the rate changes.
const TDS_RATE = 0.10;

const ALLOWED_SERVICES = ["ASSSR", "VMI", "DHC", "JASSSR"];
const ALLOWED_FORM_TYPES = ["allowance", "fellowship", "honorarium", "refund"];

const EXPECTED_HEADERS = [
  "row_id", "component", "form_type", "name", "designation", "pay_level", "address", "phone_office", "phone_mobile", "email",
  "programme_nature", "programme_title", "participation_type", "lecture_type", "honorarium_basis", "num_presences", "rate", "total_amount",
  "journey_from", "journey_to", "journey_mode", "journey_amount", "local_journey_from", "local_journey_to", "local_journey_mode", "local_journey_amount", "grand_total",
  "fellowship_rate", "fellowship_total", "refund_amount_claimed", "payment_receipt_number", "payment_receipt_date", "refund_reason", "academic_year",
  "payee_status", "payee_link_token", "pan_number", "beneficiary_name", "account_number", "bank_name", "ifsc_code", "bank_branch_address"
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRow(row, rowNum) {
  const row_id = row.row_id?.trim();
  if (!row_id) {
    return { isValid: false, reason: "Missing row_id" };
  }

  // Component check
  const rawComponent = row.component?.trim().toUpperCase();
  if (!ALLOWED_SERVICES.includes(rawComponent)) {
    return { isValid: false, reason: `Invalid component: "${row.component}"` };
  }

  // Form type check
  const rawFormType = row.form_type?.trim().toLowerCase();
  if (!ALLOWED_FORM_TYPES.includes(rawFormType)) {
    return { isValid: false, reason: `Invalid form_type: "${row.form_type}"` };
  }

  // Basic fields check
  if (!row.name?.trim()) return { isValid: false, reason: "Missing name" };
  if (!row.designation?.trim()) return { isValid: false, reason: "Missing designation" };
  if (!row.address?.trim()) return { isValid: false, reason: "Missing address" };
  if (!row.phone_mobile?.trim()) {
    return { isValid: false, reason: "Missing phone_mobile" };
  } else if (!/^\d{10}$/.test(row.phone_mobile.trim())) {
    return { isValid: false, reason: `Mobile Number must be exactly 10 digits: "${row.phone_mobile}"` };
  }
  if (!row.email?.trim() || !isValidEmail(row.email.trim())) {
    return { isValid: false, reason: `Invalid email: "${row.email}"` };
  }

  // Name & Designation must not contain numbers or special characters
  const NAME_FORMAT_REGEX = /^[A-Za-z .'\-]+$/;
  if (!NAME_FORMAT_REGEX.test(row.name.trim())) {
    return { isValid: false, reason: `Name must contain only letters (no numbers or special characters): "${row.name}"` };
  }
  if (!NAME_FORMAT_REGEX.test(row.designation.trim())) {
    return { isValid: false, reason: `Designation must contain only letters (no numbers or special characters): "${row.designation}"` };
  }

  // Payee prefilled checks (§6)
  const payeePrefilledFields = [
    "pan_number", "beneficiary_name", 
    "account_number", "bank_name", "ifsc_code", "bank_branch_address",
    "payee_link_token"
  ];
  for (const field of payeePrefilledFields) {
    if (row[field] && row[field].trim() !== "") {
      return { isValid: false, reason: `Field "${field}" must be blank on admin upload` };
    }
  }

  // Matrix-based fields check (§3)
  if (rawFormType === "allowance") {
    if (!row.programme_nature?.trim()) return { isValid: false, reason: "Missing programme_nature for allowance" };
    if (!row.programme_title?.trim()) return { isValid: false, reason: "Missing programme_title for allowance" };
    if (!row.journey_from?.trim()) return { isValid: false, reason: "Missing journey_from for allowance" };
    if (!row.journey_to?.trim()) return { isValid: false, reason: "Missing journey_to for allowance" };
    
    const journey_mode = row.journey_mode?.trim();
    if (!["Road", "Rail", "Air"].includes(journey_mode)) {
      return { isValid: false, reason: `Invalid journey_mode: "${journey_mode}"` };
    }
    
    const journey_amount = Number(row.journey_amount);
    if (Number.isNaN(journey_amount)) return { isValid: false, reason: "Invalid journey_amount" };

    const local_journey_mode = row.local_journey_mode?.trim();
    if (local_journey_mode && !["Bus", "Taxi", "Car"].includes(local_journey_mode)) {
      return { isValid: false, reason: `Invalid local_journey_mode: "${local_journey_mode}"` };
    }

    const local_journey_amount = row.local_journey_amount ? Number(row.local_journey_amount) : 0;
    if (Number.isNaN(local_journey_amount)) return { isValid: false, reason: "Invalid local_journey_amount" };

    const grand_total = Number(row.grand_total);
    if (Number.isNaN(grand_total) || Math.abs(grand_total - (journey_amount + local_journey_amount)) > 0.01) {
      return { isValid: false, reason: `grand_total must equal journey_amount + local_journey_amount` };
    }
  }

  if (rawFormType === "fellowship") {
    if (!row.programme_nature?.trim()) return { isValid: false, reason: "Missing programme_nature for fellowship" };
    if (!row.programme_title?.trim()) return { isValid: false, reason: "Missing programme_title for fellowship" };
    
    const rate = Number(row.rate);
    if (Number.isNaN(rate)) return { isValid: false, reason: "Invalid rate for fellowship" };
    
    const fellowship_rate = Number(row.fellowship_rate);
    if (Number.isNaN(fellowship_rate)) return { isValid: false, reason: "Invalid fellowship_rate" };
    
    const fellowship_total = Number(row.fellowship_total);
    if (Number.isNaN(fellowship_total)) return { isValid: false, reason: "Invalid fellowship_total" };
  }

  if (rawFormType === "honorarium") {
    if (!row.programme_nature?.trim()) return { isValid: false, reason: "Missing programme_nature for honorarium" };
    if (!row.programme_title?.trim()) return { isValid: false, reason: "Missing programme_title for honorarium" };
    
    const participation_type = row.participation_type?.trim();
    if (!["Expert", "Resource Person"].includes(participation_type)) {
      return { isValid: false, reason: `Invalid participation_type: "${participation_type}"` };
    }
    
    const lecture_type = row.lecture_type?.trim();
    if (!["Online", "Offline"].includes(lecture_type)) {
      return { isValid: false, reason: `Invalid lecture_type: "${lecture_type}"` };
    }
    
    if (!row.honorarium_basis?.trim()) return { isValid: false, reason: "Missing honorarium_basis" };
    
    const num_presences = Number(row.num_presences);
    if (Number.isNaN(num_presences)) return { isValid: false, reason: "Invalid num_presences" };
    
    const rate = Number(row.rate);
    if (Number.isNaN(rate)) return { isValid: false, reason: "Invalid rate" };
    
    const total_amount = Number(row.total_amount);
    if (Number.isNaN(total_amount) || Math.abs(total_amount - (rate * num_presences)) > 0.01) {
      return { isValid: false, reason: `total_amount must equal rate * num_presences` };
    }
  }

  if (rawFormType === "refund") {
    if (!row.programme_title?.trim()) return { isValid: false, reason: "Missing programme_title (as programme applied for) for refund" };
    
    const refund_amount_claimed = Number(row.refund_amount_claimed);
    if (Number.isNaN(refund_amount_claimed)) return { isValid: false, reason: "Invalid refund_amount_claimed" };
    
    if (!row.payment_receipt_number?.trim()) return { isValid: false, reason: "Missing payment_receipt_number" };
    
    const payment_receipt_date = row.payment_receipt_date?.trim();
    if (!payment_receipt_date || !/^\d{4}-\d{2}-\d{2}$/.test(payment_receipt_date) || Number.isNaN(Date.parse(payment_receipt_date))) {
      return { isValid: false, reason: `Invalid payment_receipt_date (expected YYYY-MM-DD): "${payment_receipt_date}"` };
    }

    if (!row.refund_reason?.trim()) return { isValid: false, reason: "Missing refund_reason" };
    if (!row.academic_year?.trim()) return { isValid: false, reason: "Missing academic_year" };
  }

  return { isValid: true };
}

router.post("/", requireAuth, requireRole(["admin"]), upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }
  if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
    return res.status(400).json({ message: "File must be a .csv" });
  }

  const validDocs = [];
  const errors = [];
  let rowNumber = 1;
  let headersChecked = false;

  try {
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csv())
        .on("headers", (headers) => {
          headersChecked = true;
          const cleanedHeaders = headers.map(h => h.trim());
          const headersMatch = cleanedHeaders.length === EXPECTED_HEADERS.length && cleanedHeaders.every((h, i) => h === EXPECTED_HEADERS[i]);
          if (!headersMatch) {
            reject(new Error(`CSV headers do not match the expected schema. Expected:\n${EXPECTED_HEADERS.join(",")}\nFound:\n${cleanedHeaders.join(",")}`));
          }
        })
        .on("data", (row) => {
          rowNumber++;
          const validation = validateRow(row, rowNumber);
          if (!validation.isValid) {
            errors.push({ row: rowNumber, reason: validation.reason });
            return;
          }

          // Gather components
          const component = row.component.trim().toUpperCase();
          const form_type = row.form_type.trim().toLowerCase();

          // Map for backward compatibility
          const services = component;
          const categoryMap = {
            allowance: "TA/DA",
            fellowship: "Fellowship",
            honorarium: "Honorarium",
            refund: "Refund"
          };
          const category = categoryMap[form_type];

          // Compute amounts for backward compatibility
          let amount = 0;
          let amountAfterTds = 0;

          if (form_type === "allowance") {
            amount = Number(row.grand_total);
            amountAfterTds = Math.round(amount * (1 - TDS_RATE) * 100) / 100;
          } else if (form_type === "fellowship") {
            amount = Number(row.fellowship_total);
            amountAfterTds = amount; // Fellowship is exempt from TDS
          } else if (form_type === "honorarium") {
            amount = Number(row.total_amount);
            amountAfterTds = Math.round(amount * (1 - TDS_RATE) * 100) / 100;
          } else if (form_type === "refund") {
            amount = Number(row.refund_amount_claimed);
            amountAfterTds = amount;
          }

          // UTRN is used as the form URL token (assigned after parsing, see below)
          const payee_link_token = null; // placeholder — filled in below

          validDocs.push({
            row_id: row.row_id.trim(),
            component,
            form_type,
            name: row.name.trim(),
            designation: row.designation.trim(),
            pay_level: row.pay_level?.trim() || null,
            address: row.address.trim(),
            phone_office: row.phone_office?.trim() || null,
            phone_mobile: row.phone_mobile.trim(),
            email: row.email.trim().toLowerCase(),
            programme_nature: row.programme_nature?.trim() || null,
            programme_title: row.programme_title?.trim() || null,
            participation_type: row.participation_type?.trim() || null,
            lecture_type: row.lecture_type?.trim() || null,
            honorarium_basis: row.honorarium_basis?.trim() || null,
            num_presences: row.num_presences ? Number(row.num_presences) : null,
            rate: row.rate ? Number(row.rate) : null,
            total_amount: row.total_amount ? Number(row.total_amount) : null,
            journey_from: row.journey_from?.trim() || null,
            journey_to: row.journey_to?.trim() || null,
            journey_mode: row.journey_mode?.trim() || null,
            journey_amount: row.journey_amount ? Number(row.journey_amount) : null,
            local_journey_from: row.local_journey_from?.trim() || null,
            local_journey_to: row.local_journey_to?.trim() || null,
            local_journey_mode: row.local_journey_mode?.trim() || null,
            local_journey_amount: row.local_journey_amount ? Number(row.local_journey_amount) : null,
            grand_total: row.grand_total ? Number(row.grand_total) : null,
            fellowship_rate: row.fellowship_rate ? Number(row.fellowship_rate) : null,
            fellowship_total: row.fellowship_total ? Number(row.fellowship_total) : null,
            refund_amount_claimed: row.refund_amount_claimed ? Number(row.refund_amount_claimed) : null,
            payment_receipt_number: row.payment_receipt_number?.trim() || null,
            payment_receipt_date: row.payment_receipt_date ? new Date(row.payment_receipt_date.trim()) : null,
            refund_reason: row.refund_reason?.trim() || null,
            academic_year: row.academic_year?.trim() || null,
            payee_status: "pending",
            payee_link_token,
            
            // Explicit Date Fields (Req 11)
            dateOfEntry: new Date(),
            dateOfUpload: new Date(),

            // Backward compatibility
            services,
            category,
            amount,
            amountAfterTds,
            token: payee_link_token
          });
        })
        .on("end", () => {
          if (!headersChecked) {
            reject(new Error("Empty CSV file or missing headers"));
          } else {
            resolve();
          }
        })
        .on("error", reject);
    });
  } catch (err) {
    return res.status(400).json({ message: err.message, errors });
  }

  let insertedCount = 0;
  // Assign UTRNs sequentially to each valid doc after parsing is complete
  // We get the current count once and offset per-doc to avoid duplicates in the batch
  try {
    const year = new Date().getFullYear();
    const baseCount = await Record.countDocuments({
      createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });
    for (let i = 0; i < validDocs.length; i++) {
      const comp = (doc.component || "ASSSR").toUpperCase();
      const prefixMap = { ASSSR: "ASR", VMI: "VMI", DHC: "DHC", JASSSR: "JAS" };
      const shortPrefix = prefixMap[comp] || comp.substring(0, 3);
      const seq = String(baseCount + i + 1).padStart(3, "0");
      const utrn = `${shortPrefix}${year}${seq}`;
      doc.payee_link_token = utrn;
      doc.token = utrn;
      doc.utr_rrn_reference_number = utrn;
      doc.utrRrnReferenceNumber = utrn;
    }
  } catch (err) {
    console.error("[UTRN] Failed to generate UTRNs for batch:", err.message);
    // Fall back to random tokens if UTRN generation fails
    for (const doc of validDocs) {
      if (!doc.payee_link_token) {
        const fallback = crypto.randomBytes(16).toString("hex");
        doc.payee_link_token = fallback;
        doc.token = fallback;
      }
    }
  }

  try {
    if (validDocs.length > 0) {
      const inserted = await Record.insertMany(validDocs, { ordered: false });
      insertedCount = inserted.length;
      // Send emails in background — don't block the response
inserted.forEach((doc) => {
  sendEmail(doc)
    .then(() => Record.findByIdAndUpdate(doc._id, { emailSent: true, emailSentAt: new Date() }))
    .catch((err) => Record.findByIdAndUpdate(doc._id, { error: err.message }));
});
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
