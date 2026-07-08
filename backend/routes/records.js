const express = require("express");
const router = express.Router();
const Record = require("../models/Record");

// GET /api/records          -> all records
// GET /api/records?category=Salary  -> filtered by category
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const records = await Record.find(filter).sort({ createdAt: -1 });
    res.json(records);
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

// PUT /api/records/:id/process
router.put("/:id/process", async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    
    record.paymentProcessed = true;
    record.paymentProcessedAt = new Date();
    await record.save();
    
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;