const express = require("express");
const router = express.Router();
const Record = require("../models/Record");

// GET /api/form/:token — fetch record by token (for pre-filling name etc)
router.get("/:token", async (req, res) => {
  try {
    const record = await Record.findOne({ token: req.params.token });
    if (!record) return res.status(404).json({ message: "Invalid or expired link." });
    if (record.formSubmitted) return res.status(410).json({ message: "Form already submitted." });
    res.json({
      name: record.name,
      email: record.email,
      amount: record.amount,
      amountAfterTds: record.amountAfterTds,
      category: record.category,
      services: record.services,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/form/:token — submit form data
router.post("/:token", async (req, res) => {
  try {
    const record = await Record.findOne({ token: req.params.token });
    if (!record) return res.status(404).json({ message: "Invalid or expired link." });
    if (record.formSubmitted) return res.status(410).json({ message: "Form already submitted." });
    record.formData = req.body;
    record.formSubmitted = true;
    await record.save();
    res.json({ message: "Form submitted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET /api/form/receipt/:token — fetch submitted record for receipt
router.get("/receipt/:token", async (req, res) => {
  try {
    const record = await Record.findOne({ token: req.params.token });
    if (!record) return res.status(404).json({ message: "Not found." });
    if (!record.formSubmitted) return res.status(403).json({ message: "Form not yet submitted." });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
