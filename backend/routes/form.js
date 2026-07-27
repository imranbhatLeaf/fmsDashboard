const express = require("express");
const router = express.Router();
const Record = require("../models/Record");
const AuditLog = require("../models/AuditLog");

// In-memory rate limiting map
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 50; // Max 50 requests per IP per window

function rateLimiter(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0";
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip).filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (requests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }
  
  requests.push(now);
  rateLimitMap.set(ip, requests);
  next();
}

// GET /api/form/receipt/:token — must be before /:token route
router.get("/receipt/:token", rateLimiter, async (req, res) => {
  try {
    const record = await Record.findOne({ $or: [{ token: req.params.token }, { payee_link_token: req.params.token }] });
    if (!record) return res.status(404).json({ message: "Not found." });
    if (!record.formSubmitted) return res.status(403).json({ message: "Form not yet submitted." });
    if (!record.bankReferenceNo || !record.dateOfTransfer) {
      return res.status(403).json({ message: "Receipt cannot be generated without Bank Reference Number and Date of Transfer." });
    }

    // Audit log read of PII
    if (record.pan_number || record.aadhaar_number) {
      const fieldsAccessing = [];
      if (record.pan_number) fieldsAccessing.push("pan_number");
      if (record.aadhaar_number) fieldsAccessing.push("aadhaar_number");
      
      await AuditLog.create({
        action: "READ_PII",
        recordId: record._id,
        fieldsAccessing,
        accessedBy: "payee/receipt-view",
        ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0"
      });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/form/:token
router.get("/:token", rateLimiter, async (req, res) => {
  try {
    const record = await Record.findOne({ $or: [{ token: req.params.token }, { payee_link_token: req.params.token }] });
    
    // Hide details: same generic error if token doesn't exist, is completed, or is expired
    if (!record || record.payee_status === "completed" || record.payee_status === "expired" || record.formSubmitted || new Date() > new Date(record.expiresAt)) {
      return res.status(404).json({ message: "Invalid or expired link." });
    }

    res.json({
      name: record.name,
      email: record.email,
      amount: record.amount,
      amountAfterTds: record.amountAfterTds,
      category: record.category,
      services: record.services,
      component: record.component,
      form_type: record.form_type,
      honorarium_basis: record.honorarium_basis,
      num_presences: record.num_presences,
      rate: record.rate,
      total_amount: record.total_amount,
      journey_from: record.journey_from,
      journey_to: record.journey_to,
      journey_mode: record.journey_mode,
      journey_amount: record.journey_amount,
      local_journey_from: record.local_journey_from,
      local_journey_to: record.local_journey_to,
      local_journey_mode: record.local_journey_mode,
      local_journey_amount: record.local_journey_amount,
      grand_total: record.grand_total,
      fellowship_rate: record.fellowship_rate,
      fellowship_total: record.fellowship_total,
      refund_amount_claimed: record.refund_amount_claimed,
      payment_receipt_number: record.payment_receipt_number,
      payment_receipt_date: record.payment_receipt_date,
      refund_reason: record.refund_reason,
      academic_year: record.academic_year
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/form/:token
router.post("/:token", rateLimiter, async (req, res) => {
  try {
    const record = await Record.findOne({ $or: [{ token: req.params.token }, { payee_link_token: req.params.token }] });
    
    // Hide details: same generic error if token doesn't exist, is completed, or is expired
    if (!record || record.payee_status === "completed" || record.payee_status === "expired" || record.formSubmitted || new Date() > new Date(record.expiresAt)) {
      return res.status(404).json({ message: "Invalid or expired link." });
    }

    const { pan, aadhaar, bankBeneficiaryName, bankAccountNumber, bankName, bankIfsc, bankBranchAddress } = req.body;

    // Validate only editable fields are provided/validated
    if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan.trim())) {
      return res.status(400).json({ message: "Invalid PAN format. Must be a 10-character alphanumeric PAN (e.g. ABCDE1234F)." });
    }

    if (aadhaar && aadhaar.trim() && !/^\d{12}$/.test(aadhaar.trim())) {
      return res.status(400).json({ message: "Invalid Aadhaar format. Must be a 12-digit numeric code if provided." });
    }

    if (!bankBeneficiaryName || !bankBeneficiaryName.trim()) {
      return res.status(400).json({ message: "Beneficiary name is required." });
    }

    if (!bankAccountNumber || !bankAccountNumber.trim()) {
      return res.status(400).json({ message: "Account number is required." });
    }

    if (!bankName || !bankName.trim()) {
      return res.status(400).json({ message: "Bank name is required." });
    }

    if (!bankIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankIfsc.trim())) {
      return res.status(400).json({ message: "Invalid IFSC format. Must be an 11-character alphanumeric code (e.g. SBIN0001234)." });
    }

    if (!bankBranchAddress || !bankBranchAddress.trim()) {
      return res.status(400).json({ message: "Bank branch address is required." });
    }

    // Populate data
    record.pan_number = pan.trim().toUpperCase();
    record.aadhaar_number = aadhaar ? aadhaar.trim() : null;
    record.beneficiary_name = bankBeneficiaryName.trim();
    record.account_number = bankAccountNumber.trim();
    record.bank_name = bankName.trim();
    record.ifsc_code = bankIfsc.trim().toUpperCase();
    record.bank_branch_address = bankBranchAddress.trim();

    // Map to formData for backward compatibility
    record.formData = {
      ...req.body,
      pan: record.pan_number,
      aadhaar: record.aadhaar_number,
      bankBeneficiaryName: record.beneficiary_name,
      bankAccountNumber: record.account_number,
      bankName: record.bank_name,
      bankIfsc: record.ifsc_code,
      bankBranchAddress: record.bank_branch_address
    };

    record.formSubmitted = true;
    record.payee_status = "completed";
    record.submittedIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0";
    
    await record.save();

    // Audit log write of PII
    await AuditLog.create({
      action: "WRITE_PII",
      recordId: record._id,
      fieldsAccessing: ["pan_number", "aadhaar_number"],
      accessedBy: "payee",
      ipAddress: record.submittedIp
    });

    res.json({ message: "Form submitted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
