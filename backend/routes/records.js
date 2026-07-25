const express = require("express");
const router = express.Router();
const Record = require("../models/Record");

// GET /api/records          -> all non-deleted records
// GET /api/records?category=Salary  -> filtered by category
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (category) filter.category = category;
    const records = await Record.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/records -> Create a single record entry
const { v4: uuidv4 } = require("uuid");
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // Trim all string values and normalize empty strings to null
    for (const key of Object.keys(data)) {
      if (typeof data[key] === "string") {
        data[key] = data[key].trim();
        if (data[key] === "") data[key] = null;
      }
    }

    // Normalize enum fields
    if (data.form_type) data.form_type = data.form_type.toLowerCase();
    if (data.component) data.component = data.component.toUpperCase();
    if (data.services) data.services = data.services.toUpperCase();

    // Auto-generate some required fields if missing
    data.row_id = data.row_id || `MANUAL_${Date.now()}`;
    data.token = data.token || uuidv4();
    data.payee_link_token = data.payee_link_token || require('crypto').randomBytes(32).toString('hex');
    data.category = data.category || "Honorarium";
    data.form_type = data.form_type || "honorarium";
    data.services = data.services || "ASSSR";
    data.component = data.component || "ASSSR";
    data.designation = data.designation || "N/A";
    data.address = data.address || "N/A";
    data.phone_mobile = data.phone_mobile || "N/A";

    // Recalculate TDS if amount is provided
    if (data.amount !== undefined && data.amount !== null) {
      data.amount = Number(data.amount);
      if (data.category === "Refund" || data.category === "TA/DA") {
        data.amountAfterTds = data.amount;
      } else {
        data.amountAfterTds = Math.round(data.amount * 0.9 * 100) / 100;
      }
    }

    const record = await Record.create(data);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/records/recycle-bin -> soft-deleted records
router.get("/recycle-bin", async (req, res) => {
  try {
    const records = await Record.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/restore -> restore a soft-deleted record
router.put("/:id/restore", async (req, res) => {
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

// PUT /api/records/:id/approve
router.put("/:id/approve", async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    
    record.registrarApproved = true;
    record.registrarApprovedAt = new Date();
    await record.save();
    
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/admin-approve
router.put("/:id/admin-approve", async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    
    record.adminApproved = true;
    record.adminApprovedAt = new Date();
    await record.save();
    
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/process
// Requires bankReferenceNo and dateOfTransfer (Req 17)
router.put("/:id/process", async (req, res) => {
  try {
    const { bankReferenceNo, dateOfTransfer } = req.body;

    if (!bankReferenceNo || !bankReferenceNo.trim()) {
      return res.status(400).json({ message: "Bank Reference No. is required to generate the receipt." });
    }
    if (!dateOfTransfer) {
      return res.status(400).json({ message: "Date of Transfer is required to generate the receipt." });
    }

    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    
    record.bankReferenceNo = bankReferenceNo.trim();
    record.dateOfTransfer = new Date(dateOfTransfer);
    record.paymentProcessed = true;
    record.paymentProcessedAt = new Date();

    // Generate receipt number if not already present
    if (!record.receiptNumber) {
      const prefix = { ASSSR: "A", VMI: "V", DHC: "D", JASSSR: "J" }[record.services] || "X";
      const year = new Date().getFullYear();
      const count = await Record.countDocuments({
        paymentProcessed: true,
      });
      const seq = String(count + 1).padStart(4, "0");
      record.receiptNumber = `${prefix}${year}${seq}`;
    }

    await record.save();
    
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/records/:id/edit -> Admin-only edit of record data (Req 21)
router.put("/:id/edit", async (req, res) => {
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
      "category", "services", "amount", "formData"
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (updates[field] === "") {
          record[field] = null;
        } else {
          record[field] = updates[field];
        }
      }
    }

    if (updates.amount !== undefined) {
      if (updates.amount === "" || updates.amount === null) {
        record.amount = null;
        record.amountAfterTds = null;
      } else {
        record.amount = Number(updates.amount);
        const category = updates.category || record.category;
        if (category === "Refund" || category === "TA/DA") {
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

// DELETE /api/records/:id -> Soft delete (Req 18, 19)
router.delete("/:id", async (req, res) => {
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