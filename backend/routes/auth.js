const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");

// Seed default users if they don't exist
async function seedUsers() {
  const admin = await User.findOne({ username: "admin" });
  if (!admin) await User.create({ username: "admin", password: "admin@fms2026", role: "admin" });
  
  const registrar = await User.findOne({ username: "registrar" });
  if (!registrar) await User.create({ username: "registrar", password: "registrar@fms2026", role: "registrar" });
}
seedUsers().catch(console.error);

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const user = await User.findOne({ 
    username: username.trim().toLowerCase(),
    password: password
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  // Generate a new session token, invalidating any old ones
  const sessionToken = crypto.randomBytes(32).toString("hex");
  user.sessionToken = sessionToken;
  await user.save();

  return res.json({ role: user.role, username: user.username, token: sessionToken });
});

// GET /api/auth/verify
// Call this from frontend to check if the session is still valid
router.get("/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  const user = await User.findOne({ sessionToken: token });
  if (!user) {
    return res.status(401).json({ message: "Session expired or logged in elsewhere." });
  }

  return res.json({ valid: true });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findOne({ sessionToken: token });
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  user.password = newPassword;
  await user.save();

  return res.json({ message: "Password reset successfully." });
});

module.exports = router;
