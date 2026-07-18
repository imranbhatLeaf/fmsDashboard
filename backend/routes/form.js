const express = require("express");
const router = express.Router();
const Record = require("../models/Record");

// GET /api/form/receipt/:token — must be before /:token route
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

// GET /api/form/:token
router.get("/:token", async (req, res) => {
  try {
    const record = await Record.findOne({ token: req.params.token });
    if (!record) return res.status(404).json({ message: "Invalid or expired link." });
    if (record.formSubmitted) return res.status(410).json({ message: "Form already submitted." });
    if (new Date() > new Date(record.expiresAt)) return res.status(410).json({ message: "Link expired." });
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

// POST /api/form/:token
router.post("/:token", async (req, res) => {
  try {
    const record = await Record.findOne({ token: req.params.token });
    if (!record) return res.status(404).json({ message: "Invalid or expired link." });
    if (record.formSubmitted) return res.status(410).json({ message: "Form already submitted." });
    if (new Date() > new Date(record.expiresAt)) return res.status(410).json({ message: "Link expired." });
    record.formData = req.body;
    record.formSubmitted = true;
    // Generate receipt number
const prefix = { ASSSR: "A", VMI: "V", DHC: "D", JASSSR: "J" }[record.services] || "X";
const year = new Date().getFullYear();
const count = await Record.countDocuments({
  services: record.services,
  formSubmitted: true,
});
const seq = String(count).padStart(4, "0");
record.receiptNumber = `${prefix}${year}${seq}`;
     // Generate receipt number
       {
  const svcPrefix = { ASSSR: "A", VMI: "V", DHC: "D", JASSSR: "J" }[record.services] || "X";
  const fy = new Date().getFullYear();
  const cnt = await Record.countDocuments({ services: record.services, formSubmitted: true });
  record.receiptNumber = `${svcPrefix}${fy}${String(cnt + 1).padStart(4, "0")}`;
}
record.submittedIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0";
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
