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

module.exports = router;