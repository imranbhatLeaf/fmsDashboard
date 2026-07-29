const express = require("express");
const router = express.Router();
const Record = require("../models/Record");
const AuditLog = require("../models/AuditLog");

async function generateUtrn(component) {
  const comp = (component || "ASSSR").toUpperCase();
  const shortPrefix = comp.substring(0, 3);
  const year = new Date().getFullYear();
  const prefix = `${shortPrefix}${year}`;
  
  const count = await Record.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  
  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

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

    const isExpired = new Date() > new Date(record.expiresAt) || (Date.now() - new Date(record.createdAt).getTime() > 45 * 24 * 60 * 60 * 1000);
    if (isExpired && !record.formSubmitted) {
      record.pan_number = "N/A";
      record.aadhaar_number = "N/A";
      record.beneficiary_name = "N/A";
      record.account_number = "N/A";
      record.bank_name = "N/A";
      record.ifsc_code = "N/A";
      record.bank_branch_address = "N/A";
      record.formSubmitted = true;
      record.payee_status = "completed";

      // Auto-approve and process
      record.adminApproved = true;
      record.adminApprovedAt = record.adminApprovedAt || new Date();
      record.dateOfForwarding = record.dateOfForwarding || new Date();

      record.registrarApproved = true;
      record.registrarApprovedAt = record.registrarApprovedAt || new Date();
      record.dateOfApproval = record.dateOfApproval || new Date();

      record.paymentProcessed = true;
      record.paymentProcessedAt = record.paymentProcessedAt || new Date();
      record.dateOfTransfer = record.dateOfTransfer || new Date();

      if (!record.bankReferenceNo) {
        record.bankReferenceNo = record.utr_rrn_reference_number || record.utrRrnReferenceNumber || await generateUtrn(record.component || record.services || "ASSSR");
      }

      if (!record.receiptNumber) {
        const prefix = { ASSSR: "A", VMI: "V", DHC: "D", JASSSR: "J" }[record.services] || "X";
        const year = new Date().getFullYear();
        const count = await Record.countDocuments({ paymentProcessed: true });
        const seq = String(count + 1).padStart(4, "0");
        record.receiptNumber = `${prefix}${year}${seq}`;
      }

      record.formData = {
        pan: "N/A",
        panConfirm: "N/A",
        aadhaar: "N/A",
        bankBeneficiaryName: "N/A",
        bankAccountNumber: "N/A",
        bankAccountNumberConfirm: "N/A",
        bankName: "N/A",
        bankIfsc: "N/A",
        bankIfscConfirm: "N/A",
        bankBranchAddress: "N/A"
      };
      await record.save();
    }

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
    if (!record) return res.status(404).json({ message: "Invalid link." });

    const isExpired = new Date() > new Date(record.expiresAt) || (Date.now() - new Date(record.createdAt).getTime() > 45 * 24 * 60 * 60 * 1000);
    if (isExpired && !record.formSubmitted) {
      record.pan_number = "N/A";
      record.aadhaar_number = "N/A";
      record.beneficiary_name = "N/A";
      record.account_number = "N/A";
      record.bank_name = "N/A";
      record.ifsc_code = "N/A";
      record.bank_branch_address = "N/A";
      record.formSubmitted = true;
      record.payee_status = "completed";

      // Auto-approve and process
      record.adminApproved = true;
      record.adminApprovedAt = record.adminApprovedAt || new Date();
      record.dateOfForwarding = record.dateOfForwarding || new Date();

      record.registrarApproved = true;
      record.registrarApprovedAt = record.registrarApprovedAt || new Date();
      record.dateOfApproval = record.dateOfApproval || new Date();

      record.paymentProcessed = true;
      record.paymentProcessedAt = record.paymentProcessedAt || new Date();
      record.dateOfTransfer = record.dateOfTransfer || new Date();

      if (!record.bankReferenceNo) {
        record.bankReferenceNo = record.utr_rrn_reference_number || record.utrRrnReferenceNumber || await generateUtrn(record.component || record.services || "ASSSR");
      }

      if (!record.receiptNumber) {
        const prefix = { ASSSR: "A", VMI: "V", DHC: "D", JASSSR: "J" }[record.services] || "X";
        const year = new Date().getFullYear();
        const count = await Record.countDocuments({ paymentProcessed: true });
        const seq = String(count + 1).padStart(4, "0");
        record.receiptNumber = `${prefix}${year}${seq}`;
      }

      record.formData = {
        pan: "N/A",
        panConfirm: "N/A",
        aadhaar: "N/A",
        bankBeneficiaryName: "N/A",
        bankAccountNumber: "N/A",
        bankAccountNumberConfirm: "N/A",
        bankName: "N/A",
        bankIfsc: "N/A",
        bankIfscConfirm: "N/A",
        bankBranchAddress: "N/A"
      };
      await record.save();
    }
    
    // Allow completed or submitted records to be fetched to show status
    if (record.payee_status === "expired") {
      return res.status(404).json({ message: "Invalid or expired link." });
    }

    let approvalStatus = "Pending Verification & Approval";
    if (record.paymentProcessed) {
      approvalStatus = "Payment Processed (Completed)";
    } else if (record.registrarApproved) {
      approvalStatus = "Approved by Registrar, Pending Payment";
    } else if (record.adminApproved) {
      approvalStatus = "Approved by Admin, Pending Registrar Approval";
    }

    res.json({
      name: record.name,
      email: record.email,
      designation: record.designation,
      address: record.address,
      phone_office: record.phoneOffice,
      phone_mobile: record.phoneMobile,
      amount: record.amount,
      amountAfterTds: record.amountAfterTds,
      category: record.category,
      services: record.services,
      component: record.component,
      form_type: record.form_type,
      formSubmitted: record.formSubmitted || false,
      approvalStatus,
      honorarium_basis: record.honorariumBasis,
      num_presences: record.numPresences,
      rate: record.rate,
      total_amount: record.amount,
      journey_from: record.journeyFrom,
      journey_to: record.journeyTo,
      journey_mode: record.journeyMode,
      journey_amount: record.journeyAmount,
      local_journey_from: record.localJourneyFrom,
      local_journey_to: record.localJourneyTo,
      local_journey_mode: record.localJourneyMode,
      local_journey_amount: record.localJourneyAmount,
      grand_total: record.grandTotal,
      fellowship_rate: record.fellowshipRate,
      fellowship_total: record.fellowshipTotal,
      refund_amount_claimed: record.refundAmountClaimed,
      payment_receipt_number: record.paymentReceiptNumber,
      payment_receipt_date: record.paymentReceiptDate,
      refund_reason: record.refundReason,
      academic_year: record.academicYear,
      programme_nature: record.programmeNature,
      programme_title: record.programmeTitle,
      participation_type: record.participationType,
      lecture_type: record.lectureType
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
    if (!pan || !pan.trim()) {
      return res.status(400).json({ message: "PAN Card is required." });
    }

    // Aadhaar is optional; no pattern validation is enforced if provided

    if (!bankBeneficiaryName || !bankBeneficiaryName.trim()) {
      return res.status(400).json({ message: "Beneficiary name is required." });
    }

    if (!bankAccountNumber || !bankAccountNumber.trim()) {
      return res.status(400).json({ message: "Account number is required." });
    }

    if (!bankName || !bankName.trim()) {
      return res.status(400).json({ message: "Bank name is required." });
    }

    if (!bankIfsc || !bankIfsc.trim()) {
      return res.status(400).json({ message: "IFSC code is required." });
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

    // Send Stage 2 email (UTRN Issued) in background
    const { sendEmail } = require("../utils/mailer");
    sendEmail(record, 2).catch((err) => {
      console.error("Error sending stage 2 email:", err);
    });

    res.json({ message: "Form submitted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
