const express = require("express");
const router = express.Router();

// ---------------------------------------------------------------------------
// Credentials — swap these out for a DB lookup whenever you're ready.
// Store passwords as bcrypt hashes in production.
// ---------------------------------------------------------------------------
const USERS = [
  { username: "admin",     password: "admin@fms2026",     role: "admin" },
  { username: "registrar", password: "registrar@fms2026", role: "registrar" },
];

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const user = USERS.find(
    (u) => u.username === username.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  // Return role so the client can route accordingly.
  // In production, return a signed JWT here instead.
  return res.json({ role: user.role, username: user.username });
});

module.exports = router;
