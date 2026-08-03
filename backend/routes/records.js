const express = require("express");
const router = express.Router();
const Record = require("../models/Record");
const { requireAuth, requireRole } = require("../utils/auth");
const { sendEmail } = require("../utils/mailer");

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

// GET /api/records          -> all non-deleted records
// GET /api/records?category=Salary  -> filtered by category
// GET /api/records?component=ASSSR -> filtered by component (Req 18 fix)
router.get("/", requireAuth, async (req, res) => {
  try {
    // Auto-fill unsubmitted records older than 45 days as N/A and approve/process them automatically
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const expiredRecords = await Record.find({
      formSubmitted: { $ne: true },
      createdAt: { $lt: fortyFiveDaysAgo },
      isDeleted: { $ne: true }
    });

    for (const record of expiredRecords) {
      record.pan_number = "N/A";
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

    const { category, component, adminApproved } = req.query;
    const filter = { isDeleted: { $ne: true } };
    
    if (category) filter.category = category;
    if (component) filter.services = component;
    if (adminApproved !== undefined) {
      filter.adminApproved = adminApproved === "true";
    }
    
    const records = await Record.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/records -> Create a single record entry (Admin-only)
const { v4: uuidv4 } = require("uuid");
router.post("/", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const data = req.body;

    // Trim all string values and normalize empty strings to null
    for (const key of Object.keys(data)) {
      if (typeof data[key] === "string") {
        data[key] = data[key].trim();
        if (data[key] === "") data[key] = null;
      }
    }

    // Name & Designation must not contain numbers or special characters
    const NAME_FORMAT_REGEX = /^[A-Za-z .'\\-]+$/;
    const nameToCheck = data.name || data.applicant_name;
    if (nameToCheck && !NAME_FORMAT_REGEX.test(nameToCheck)) {
      return res.status(400).json({ message: "Name must contain only letters (no numbers or special characters)." });
    }
    if (data.designation && data.designation !== "N/A" && !NAME_FORMAT_REGEX.test(data.designation)) {
      return res.status(400).json({ message: "Designation must contain only letters (no numbers or special characters)." });
    }

    // Mobile Number: exactly 10 digits
    const mobileToCheck = data.phone_mobile || data.mobile_number;
    if (mobileToCheck && mobileToCheck !== "N/A" && !/^\d{10}$/.test(mobileToCheck)) {
      return res.status(400).json({ message: "Mobile Number must be exactly 10 digits (numbers only)." });
    }

    // Normalize enum fields
    if (data.form_type) data.form_type = data.form_type.toLowerCase();
    if (data.component) data.component = data.component.toUpperCase();
    if (data.services) data.services = data.services.toUpperCase();

    // ASSSR Refund Form normalization & compatibility mapping
    if (data.form_type === "refund" || data.category === "Refund") {
      data.category = "Refund";
      data.form_type = "refund";
      if (data.applicant_name) data.name = data.applicant_name;
      if (data.mobile_number) data.phone_mobile = data.mobile_number;
      if (data.refund_amount) {
        data.refund_amount_claimed = Number(data.refund_amount);
        data.amount = Number(data.refund_amount);
      }
      if (data.reason_for_refund) data.refund_reason = data.reason_for_refund;
      if (data.programme_applied_for) data.programme_title = data.programme_applied_for;
      
      // Sync camelCase fields
      data.refundAmountClaimed = data.refund_amount_claimed;
      data.paymentReceiptNumber = data.payment_receipt_number;
      data.paymentReceiptDate = data.payment_receipt_date;
      data.refundReason = data.refund_reason;
      data.academicYear = data.academic_year;
      data.phoneMobile = data.phone_mobile;
      data.programmeTitle = data.programme_title;
    }

    // ASSSR Fellowship Form normalization & compatibility mapping
    if (data.form_type === "fellowship" || data.category === "Fellowship") {
      data.category = "Fellowship";
      data.form_type = "fellowship";
      if (data.nature_of_programme) data.programme_nature = data.nature_of_programme;
      if (data.title_of_programme) data.programme_title = data.title_of_programme;
      if (data.telephone_office) data.phone_office = data.telephone_office;
      if (data.telephone_mobile) data.phone_mobile = data.telephone_mobile;
      if (data.rate) data.fellowshipRate = Number(data.rate);
      if (data.total) {
        data.fellowshipTotal = Number(data.total);
        data.amount = Number(data.total);
      }
      if (data.fellowship_as_per_norms) data.fellowshipAsPerNorms = data.fellowship_as_per_norms;

      // Sync camelCase fields
      data.programmeNature = data.programme_nature;
      data.programmeTitle = data.programme_title;
      data.phoneOffice = data.phone_office;
      data.phoneMobile = data.phone_mobile;
      data.fellowship_as_per_norms = data.fellowshipAsPerNorms;
    }

    // ASSSR TA/DA Form normalization & compatibility mapping
    if (data.form_type === "tada" || data.category === "TA/DA") {
      data.category = "TA/DA";
      data.form_type = "tada";
      if (data.telephone_office) data.phone_office = data.telephone_office;
      if (data.telephone_mobile) data.phone_mobile = data.telephone_mobile;

      // Extract first row details if available for single-value column fallback compatibility
      if (data.journeyRows && data.journeyRows.length > 0) {
        const first = data.journeyRows[0];
        data.journey_from = first.journey_from;
        data.journey_to = first.journey_to;
        data.journey_mode = first.journey_mode;
        data.journey_amount = Number(first.journey_amount || 0);
      }
      if (data.localJourneyRows && data.localJourneyRows.length > 0) {
        const first = data.localJourneyRows[0];
        data.local_journey_from = first.local_journey_from;
        data.local_journey_to = first.local_journey_to;
        data.local_journey_mode = first.local_journey_mode;
        data.local_journey_amount = Number(first.local_journey_amount || 0);
      }

      // Calculate totals
      const journeySum = (data.journeyRows || []).reduce((acc, row) => acc + Number(row.journey_amount || 0), 0);
      const localSum = (data.localJourneyRows || []).reduce((acc, row) => acc + Number(row.local_journey_amount || 0), 0);
      data.grand_total = journeySum + localSum;
      data.amount = data.grand_total;

      // Sync camelCase fields
      data.phoneOffice = data.phone_office;
      data.phoneMobile = data.phone_mobile;
      data.journeyFrom = data.journey_from;
      data.journeyTo = data.journey_to;
      data.journeyMode = data.journey_mode;
      data.journeyAmount = data.journey_amount;
      data.localJourneyFrom = data.local_journey_from;
      data.localJourneyTo = data.local_journey_to;
      data.localJourneyMode = data.local_journey_mode;
      data.localJourneyAmount = data.local_journey_amount;
      data.grandTotal = data.grand_total;
    }

    // ASSSR Honorarium Form normalization & compatibility mapping
    if (data.form_type === "honorarium" || data.category === "Honorarium") {
      data.category = "Honorarium";
      data.form_type = "honorarium";
      if (data.nature_of_programme) data.programme_nature = data.nature_of_programme;
      if (data.title_of_programme) data.programme_title = data.title_of_programme;
      if (data.nature_of_participation) data.participation_type = data.nature_of_participation;
      if (data.telephone_office) data.phone_office = data.telephone_office;
      if (data.telephone_mobile) data.phone_mobile = data.telephone_mobile;
      if (data.number_of_presences) data.num_presences = Number(data.number_of_presences);
      if (data.rate) data.rate = Number(data.rate);
      if (data.total) {
        data.total_amount = Number(data.total);
        data.amount = Number(data.total);
      }
      if (data.presences_unit) data.presencesUnit = data.presences_unit;
      if (data.honorarium_as_per_norms) data.honorariumAsPerNorms = data.honorarium_as_per_norms;

      // Sync camelCase fields
      data.programmeNature = data.programme_nature;
      data.programmeTitle = data.programme_title;
      data.participationType = data.participation_type;
      data.phoneOffice = data.phone_office;
      data.phoneMobile = data.phone_mobile;
      data.numPresences = data.num_presences;
      data.presences_unit = data.presencesUnit;
      data.honorarium_as_per_norms = data.honorariumAsPerNorms;
    }

    // Office use only camelCase sync
    if (data.entitled_amount) data.entitledAmount = Number(data.entitled_amount);
    if (data.entitled_amount_words) data.entitledAmountWords = data.entitled_amount_words;
    if (data.expenditure_debitable_to) data.expenditureDebitableTo = data.expenditure_debitable_to;
    if (data.treasurer_signature) data.treasurerSignature = data.treasurer_signature;
    if (data.participation_payment_certified_by) data.participationPaymentCertifiedBy = data.participation_payment_certified_by;
    if (data.received_amount) data.receivedAmount = Number(data.received_amount);
    if (data.received_amount_words) data.receivedAmountWords = data.received_amount_words;
    if (data.applicant_signature) data.applicantSignature = data.applicant_signature;
    if (data.passed_for_payment_amount) {
      data.passedForPaymentAmount = Number(data.passed_for_payment_amount);
      data.amount = data.passedForPaymentAmount;
    }
    if (data.passed_for_payment_amount_words) data.passedForPaymentAmountWords = data.passed_for_payment_amount_words;
    if (!data.utr_rrn_reference_number || String(data.utr_rrn_reference_number).trim() === "") {
      data.utr_rrn_reference_number = await generateUtrn(data.component || data.services || "ASSSR");
    }
    data.utrRrnReferenceNumber = data.utr_rrn_reference_number;
    data.bankReferenceNo = data.utr_rrn_reference_number;
    // Use UTRN as the form link token so URL becomes /form/<UTRN>
    data.payee_link_token = data.utr_rrn_reference_number;
    data.token = data.utr_rrn_reference_number;
    if (!data.payment_receipt_date) data.payment_receipt_date = new Date();
    if (!data.payment_dated) data.payment_dated = new Date();
    data.paymentDated = data.payment_dated;
    if (data.secretary_or_president_signature) data.secretaryOrPresidentSignature = data.secretary_or_president_signature;

    // Auto-generate required fields if missing or null/empty
    const requiredFallbacks = {
      row_id: () => `MANUAL_${Date.now()}`,
      token: () => data.utr_rrn_reference_number || require("uuid").v4(),
      payee_link_token: () => data.utr_rrn_reference_number || require("crypto").randomBytes(32).toString("hex"),
      category: () => "Honorarium",
      form_type: () => "honorarium",
      services: () => "ASSSR",
      component: () => "ASSSR",
      designation: () => "N/A",
      address: () => "N/A",
      phone_mobile: () => "N/A"
    };

    for (const [key, getFallback] of Object.entries(requiredFallbacks)) {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        data[key] = getFallback();
      }
    }

    // Set mandatory dates (Req 11)
    data.dateOfEntry = new Date();
    data.dateOfUpload = null; // manual entry has no upload date, or null

    // Recalculate TDS if amount is provided
    if (data.amount !== undefined && data.amount !== null) {
      data.amount = Number(data.amount);
      if (data.category === "Refund" || data.category === "Fellowship") {
        data.amountAfterTds = data.amount;
      } else {
        data.amountAfterTds = Math.round(data.amount * 0.9 * 100) / 100;
      }
    }

    const record = await Record.create(data);

    // Send email in background — don't block the response
    console.log(`[EMAIL] Triggering Stage 1 email for record: ${record._id}, payee: ${record.name}, to: ${record.email}`);
    sendEmail(record)
      .then((info) => {
        console.log(`[EMAIL] ✓ Sent successfully to ${record.email}. MessageId: ${info?.messageId || "n/a"}`);
        return Record.findByIdAndUpdate(record._id, { emailSent: true, emailSentAt: new Date() });
      })
      .catch((err) => {
        console.error(`[EMAIL] ✗ Failed to send to ${record.email}. Error: ${err.message}`);
        return Record.findByIdAndUpdate(record._id, { error: err.message });
      });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/records/recycle-bin -> soft-deleted records (Registrar-only)
router.get("/recycle-bin", requireAuth, requireRole(["registrar"]), async (req, res) => {
  try {
    const records = await Record.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/restore -> restore a soft-deleted record (Registrar-only)
router.put("/:id/restore", requireAuth, requireRole(["registrar"]), async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    
    record.isDeleted = false;
    record.deletedAt = null;
    await record.save();
    
    res.json({ message: "Record restored successfully", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/approve -> Registrar Approval (Registrar-only)
router.put("/:id/approve", requireAuth, requireRole(["registrar"]), async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    if (!record.adminApproved) {
      return res.status(400).json({ message: "Record must be approved by the Admin first." });
    }
    
    record.registrarApproved = true;
    record.registrarApprovedAt = new Date();
    record.dateOfApproval = new Date(); // Req 11
    await record.save();
    
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/admin-approve -> Admin Approval/Forwarding (Admin-only)
router.put("/:id/admin-approve", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    if (!record.formSubmitted) {
      return res.status(400).json({ message: "Payee must submit details before Admin approval." });
    }
    
    record.adminApproved = true;
    record.adminApprovedAt = new Date();
    record.dateOfForwarding = new Date(); // Req 11
    // Clear any previous rejection
    record.rejected = false;
    record.rejectedAt = null;
    record.rejectionReason = null;
    record.rejectedBy = null;
    await record.save();
    
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/reject -> Reject an application (Admin or Registrar)
router.put("/:id/reject", requireAuth, requireRole(["admin", "registrar"]), async (req, res) => {
  try {
    const { reason } = req.body;
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    const role = req.user?.role || "unknown";

    record.rejected = true;
    record.rejectedAt = new Date();
    record.rejectionReason = reason || "No reason provided";
    record.rejectedBy = role;

    // Roll back the relevant approval so the record doesn't remain in a stale state
    if (role === "registrar") {
      // Registrar rejection: undo admin approval so it goes back to needs-admin-approval state
      record.adminApproved = false;
      record.adminApprovedAt = null;
      record.dateOfForwarding = null;
    } else if (role === "admin") {
      // Admin rejection: reset form submission so payee can be notified
      // (keeps the record visible but clearly rejected)
    }

    await record.save();

    // Send rejection email to payee in background (Stage 4)
    sendEmail(record, 4).catch((err) => {
      console.error("[EMAIL] Failed to send rejection email:", err.message);
    });

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/process -> Process payment and generate receipt (Admin-only)
// bankReferenceNo is now a MANUAL field separate from UTRN — must be provided in request body
router.put("/:id/process", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { bankReferenceNo, dateOfTransfer } = req.body;

    if (!bankReferenceNo || !String(bankReferenceNo).trim()) {
      return res.status(400).json({ message: "Bank Reference No is required." });
    }
    if (!dateOfTransfer) {
      return res.status(400).json({ message: "Date of Transfer is required." });
    }

    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    // bankReferenceNo is now a distinct manual field — UTRN (utr_rrn_reference_number) remains unchanged
    record.bankReferenceNo = String(bankReferenceNo).trim();
    record.dateOfTransfer = new Date(dateOfTransfer);
    record.paymentProcessed = true;
    record.paymentProcessedAt = new Date();

    // Generate receipt number if not already present
    if (!record.receiptNumber) {
      const prefix = { ASSSR: "A", VMI: "V", DHC: "D", JASSSR: "J" }[record.services] || "X";
      const year = new Date().getFullYear();
      const count = await Record.countDocuments({ paymentProcessed: true });
      const seq = String(count + 1).padStart(4, "0");
      record.receiptNumber = `${prefix}${year}${seq}`;
    }

    await record.save();

    // Send Stage 3 email (Payment Released) in background
    sendEmail(record, 3).catch((err) => {
      console.error("Error sending stage 3 email:", err);
    });

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/edit -> Admin-only edit of record data (Req 21)
router.put("/:id/edit", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    const updates = req.body;
    const allowedFields = [
      "row_id", "component", "form_type", "name", "designation", "pay_level", "address", 
      "phone_office", "phone_mobile", "email", "programme_nature", "programme_title", 
      "participation_type", "lecture_type", "honorarium_basis", "num_presences", "rate", 
      "total_amount", "journey_from", "journey_to", "journey_mode", "journey_amount", 
      "local_journey_from", "local_journey_to", "local_journey_mode", "local_journey_amount", 
      "grand_total", "fellowship_rate", "fellowship_total", "refund_amount_claimed", 
      "payment_receipt_number", "payment_receipt_date", "refund_reason", "academic_year", 
      "category", "services", "amount", "formData",
      "entitled_amount", "entitled_amount_words", "expenditure_debitable_to", "treasurer_signature",
      "participation_payment_certified_by", "received_amount", "received_amount_words", "applicant_signature",
      "passed_for_payment_amount", "passed_for_payment_amount_words", "utr_rrn_reference_number",
      "payment_dated", "secretary_or_president_signature", "programme_applied_for", "refund_amount",
      "mobile_number", "applicant_name", "reason_for_refund",
      "fellowship_as_per_norms", "claimant_signature",
      "journeyRows", "localJourneyRows", "remarks",
      "presences_unit", "honorarium_as_per_norms"
    ];

    const editFallbacks = {
      row_id: () => `MANUAL_${Date.now()}`,
      component: () => "ASSSR",
      form_type: () => "honorarium",
      designation: () => "N/A",
      address: () => "N/A",
      phone_mobile: () => "N/A",
      services: () => "ASSSR",
      category: () => "Honorarium"
    };

    const NAME_FORMAT_REGEX = /^[A-Za-z .'\\-]+$/;
    const nameToCheck = updates.name || updates.applicant_name;
    if (nameToCheck && !NAME_FORMAT_REGEX.test(nameToCheck)) {
      return res.status(400).json({ message: "Name must contain only letters (no numbers or special characters)." });
    }
    if (updates.designation && updates.designation !== "N/A" && !NAME_FORMAT_REGEX.test(updates.designation)) {
      return res.status(400).json({ message: "Designation must contain only letters (no numbers or special characters)." });
    }
    const mobileToCheck = updates.phone_mobile || updates.mobile_number || updates.telephone_mobile;
    if (mobileToCheck && mobileToCheck !== "N/A" && !/^\d{10}$/.test(mobileToCheck)) {
      return res.status(400).json({ message: "Mobile Number must be exactly 10 digits (numbers only)." });
    }

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (updates[field] === "" || updates[field] === null) {
          if (editFallbacks[field]) {
            record[field] = editFallbacks[field]();
          } else {
            record[field] = null;
          }
        } else {
          record[field] = updates[field];
        }
      }
    }

    // Sync ASSSR Refund Form fields
    if (record.form_type === "refund" || record.category === "Refund") {
      record.category = "Refund";
      record.form_type = "refund";
      if (record.applicant_name) record.name = record.applicant_name;
      if (record.mobile_number) record.phone_mobile = record.mobile_number;
      if (record.refund_amount) {
        record.refund_amount_claimed = Number(record.refund_amount);
        record.amount = Number(record.refund_amount);
      }
      if (record.reason_for_refund) record.refund_reason = record.reason_for_refund;
      if (record.programme_applied_for) record.programme_title = record.programme_applied_for;

      // Sync camelCase
      record.refundAmountClaimed = record.refund_amount_claimed;
      record.paymentReceiptNumber = record.payment_receipt_number;
      record.paymentReceiptDate = record.payment_receipt_date;
      record.refundReason = record.refund_reason;
      record.academicYear = record.academic_year;
      record.phoneMobile = record.phone_mobile;
      record.programmeTitle = record.programme_title;
    }

    // Sync ASSSR Fellowship Form fields
    if (record.form_type === "fellowship" || record.category === "Fellowship") {
      record.category = "Fellowship";
      record.form_type = "fellowship";
      if (record.nature_of_programme) record.programme_nature = record.nature_of_programme;
      if (record.title_of_programme) record.programme_title = record.title_of_programme;
      if (record.telephone_office) record.phone_office = record.telephone_office;
      if (record.telephone_mobile) record.phone_mobile = record.telephone_mobile;
      if (record.rate) record.fellowshipRate = Number(record.rate);
      if (record.total) {
        record.fellowshipTotal = Number(record.total);
        record.amount = Number(record.total);
      }
      if (record.fellowship_as_per_norms) record.fellowshipAsPerNorms = record.fellowship_as_per_norms;

      // Sync camelCase fields
      record.programmeNature = record.programme_nature;
      record.programmeTitle = record.programme_title;
      record.phoneOffice = record.phone_office;
      record.phoneMobile = record.phone_mobile;
      record.fellowship_as_per_norms = record.fellowshipAsPerNorms;
    }

    // Sync ASSSR TA/DA Form fields
    if (record.form_type === "tada" || record.category === "TA/DA") {
      record.category = "TA/DA";
      record.form_type = "tada";
      if (record.telephone_office) record.phone_office = record.telephone_office;
      if (record.telephone_mobile) record.phone_mobile = record.telephone_mobile;

      // Extract first row details if available for single-value column fallback compatibility
      if (record.journeyRows && record.journeyRows.length > 0) {
        const first = record.journeyRows[0];
        record.journey_from = first.journey_from;
        record.journey_to = first.journey_to;
        record.journey_mode = first.journey_mode;
        record.journey_amount = Number(first.journey_amount || 0);
      }
      if (record.localJourneyRows && record.localJourneyRows.length > 0) {
        const first = record.localJourneyRows[0];
        record.local_journey_from = first.local_journey_from;
        record.local_journey_to = first.local_journey_to;
        record.local_journey_mode = first.local_journey_mode;
        record.local_journey_amount = Number(first.local_journey_amount || 0);
      }

      // Calculate totals
      const journeySum = (record.journeyRows || []).reduce((acc, row) => acc + Number(row.journey_amount || 0), 0);
      const localSum = (record.localJourneyRows || []).reduce((acc, row) => acc + Number(row.local_journey_amount || 0), 0);
      record.grand_total = journeySum + localSum;
      record.amount = record.grand_total;

      // Sync camelCase fields
      record.phoneOffice = record.phone_office;
      record.phoneMobile = record.phone_mobile;
      record.journeyFrom = record.journey_from;
      record.journeyTo = record.journey_to;
      record.journeyMode = record.journey_mode;
      record.journeyAmount = record.journey_amount;
      record.localJourneyFrom = record.local_journey_from;
      record.localJourneyTo = record.local_journey_to;
      record.localJourneyMode = record.local_journey_mode;
      record.localJourneyAmount = record.local_journey_amount;
      record.grandTotal = record.grand_total;
    }

    // Sync ASSSR Honorarium Form fields
    if (record.form_type === "honorarium" || record.category === "Honorarium") {
      record.category = "Honorarium";
      record.form_type = "honorarium";
      if (record.nature_of_programme) record.programme_nature = record.nature_of_programme;
      if (record.title_of_programme) record.programme_title = record.title_of_programme;
      if (record.nature_of_participation) record.participation_type = record.nature_of_participation;
      if (record.telephone_office) record.phone_office = record.telephone_office;
      if (record.telephone_mobile) record.phone_mobile = record.telephone_mobile;
      if (record.number_of_presences) record.num_presences = Number(record.number_of_presences);
      if (record.rate) record.rate = Number(record.rate);
      if (record.total) {
        record.total_amount = Number(record.total);
        record.amount = Number(record.total);
      }
      if (record.presences_unit) record.presencesUnit = record.presences_unit;
      if (record.honorarium_as_per_norms) record.honorariumAsPerNorms = record.honorarium_as_per_norms;

      // Sync camelCase fields
      record.programmeNature = record.programme_nature;
      record.programmeTitle = record.programme_title;
      record.participationType = record.participation_type;
      record.phoneOffice = record.phone_office;
      record.phoneMobile = record.phone_mobile;
      record.numPresences = record.num_presences;
      record.presences_unit = record.presencesUnit;
      record.honorarium_as_per_norms = record.honorariumAsPerNorms;
    }

    // Office use only camelCase sync
    if (record.entitled_amount) record.entitledAmount = Number(record.entitled_amount);
    if (record.entitled_amount_words) record.entitledAmountWords = record.entitled_amount_words;
    if (record.expenditure_debitable_to) record.expenditureDebitableTo = record.expenditure_debitable_to;
    if (record.treasurer_signature) record.treasurerSignature = record.treasurer_signature;
    if (record.participation_payment_certified_by) record.participationPaymentCertifiedBy = record.participation_payment_certified_by;
    if (record.received_amount) record.receivedAmount = Number(record.received_amount);
    if (record.received_amount_words) record.receivedAmountWords = record.received_amount_words;
    if (record.applicant_signature) record.applicantSignature = record.applicant_signature;
    if (record.passed_for_payment_amount) {
      record.passedForPaymentAmount = Number(record.passed_for_payment_amount);
      record.amount = record.passedForPaymentAmount;
    }
    if (record.passed_for_payment_amount_words) record.passedForPaymentAmountWords = record.passed_for_payment_amount_words;
    if (!record.utr_rrn_reference_number || String(record.utr_rrn_reference_number).trim() === "") {
      record.utr_rrn_reference_number = await generateUtrn(record.component || record.services || "ASSSR");
    }
    record.utrRrnReferenceNumber = record.utr_rrn_reference_number;
    if (!record.payment_receipt_date) record.payment_receipt_date = new Date();
    if (!record.payment_dated) record.payment_dated = new Date();
    record.paymentDated = record.payment_dated;
    if (record.secretary_or_president_signature) record.secretaryOrPresidentSignature = record.secretary_or_president_signature;

    if (updates.amount !== undefined) {
      if (updates.amount === "" || updates.amount === null) {
        record.amount = null;
        record.amountAfterTds = null;
      } else {
        record.amount = Number(updates.amount);
        const category = updates.category || record.category;
        if (category === "Refund" || category === "Fellowship") {
          record.amountAfterTds = record.amount;
        } else {
          record.amountAfterTds = Math.round(record.amount * 0.9 * 100) / 100;
        }
      }
    }

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/records/:id -> Soft delete (Registrar-only) (Req 16, 18, 19)
router.delete("/:id", requireAuth, requireRole(["registrar"]), async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    record.isDeleted = true;
    record.deletedAt = new Date();
    await record.save();

    res.json({ message: "Record moved to recycle bin." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;