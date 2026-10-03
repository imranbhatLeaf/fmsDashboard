const express = require("express");
const router = express.Router();
const Record = require('../models/Record');

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/verification"
    : "https://sandbox.cashfree.com/verification";

const CF_HEADERS = {
  "x-client-id": process.env.CASHFREE_CLIENT_ID,
  "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
  "x-api-version": process.env.CASHFREE_API_VERSION || "2024-12-01",
  "Content-Type": "application/json",
};

// ─── Rate Limiting (shared simple in-memory store) ───────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 20; // stricter for KYC endpoints

function rateLimiter(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0";
  const now = Date.now();
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const requests = rateLimitMap
    .get(ip)
    .filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (requests.length >= RATE_LIMIT_MAX) {
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  }
  requests.push(now);
  rateLimitMap.set(ip, requests);
  next();
}

// ─── Helper: normalize name for fuzzy comparison ─────────────────────────────
function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z ]/g, ""); // strip non-alpha chars
}

// Token similarity — simple word-overlap check
function namesMatch(a = "", b = "") {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  const wordsA = new Set(na.split(" ").filter(Boolean));
  const wordsB = new Set(nb.split(" ").filter(Boolean));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  const similarity = intersection.length / union.size;
  return similarity >= 0.6; // 60% word overlap threshold
}

// ─── POST /api/verify/aadhaar/generate-otp ───────────────────────────────────
// Body: { aadhaar: "123456789012" }
// Cashfree: POST /verification/offline-aadhaar/otp  → returns ref_id
router.post("/aadhaar/generate-otp", rateLimiter, async (req, res) => {
  const { aadhaar } = req.body;

  if (!aadhaar || !/^\d{12}$/.test(aadhaar.trim())) {
    return res
      .status(400)
      .json({ message: "Please enter a valid 12-digit Aadhaar number." });
  }

  try {
    const cfRes = await fetch(`${CASHFREE_BASE}/offline-aadhaar/otp`, {
      method: "POST",
      headers: CF_HEADERS,
      body: JSON.stringify({ aadhaar_number: aadhaar.trim() }),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok || cfData.status === "INVALID") {
      const msg = cfData?.message || cfData?.error?.message || "Failed to send OTP. Please try again.";
      return res.status(cfRes.ok ? 400 : cfRes.status).json({ message: msg });
    }

    // Cashfree returns ref_id needed to verify OTP
    return res.json({
      success: true,
      ref_id: cfData.ref_id,
      message: "OTP sent to your Aadhaar-registered mobile number.",
    });
  } catch (err) {
    console.error("Aadhaar OTP generation error:", err);
    return res
      .status(500)
      .json({ message: "Server error. Please try again." });
  }
});

// ─── POST /api/verify/aadhaar/verify-otp ─────────────────────────────────────
// Body: { ref_id: "...", otp: "123456" }
// Cashfree: POST /verification/offline-aadhaar/verify → returns name, dob, etc.
router.post("/aadhaar/verify-otp", rateLimiter, async (req, res) => {
  const { ref_id, otp } = req.body;

  if (!ref_id || !otp) {
    return res.status(400).json({ message: "OTP and reference ID are required." });
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    return res
      .status(400)
      .json({ message: "OTP must be exactly 6 digits." });
  }

  try {
    const cfRes = await fetch(`${CASHFREE_BASE}/offline-aadhaar/verify`, {
      method: "POST",
      headers: CF_HEADERS,
      body: JSON.stringify({ otp: otp.trim(), ref_id }),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok || cfData.status === "INVALID") {
      const msg =
        cfData?.message || cfData?.error?.message || "Invalid OTP. Please try again.";
      return res.status(cfRes.ok ? 400 : cfRes.status).json({ message: msg });
    }

    // Return just the name — keep Aadhaar data minimal on our side
    const aadhaarName =
      cfData?.data?.name ||
      cfData?.name ||
      cfData?.full_name ||
      null;

    if (!aadhaarName) {
      return res.status(400).json({
        message: "Could not retrieve name from Aadhaar. Please try again.",
      });
    }

    return res.json({
      success: true,
      aadhaar_name: aadhaarName,
      message: "Aadhaar verified successfully.",
    });
  } catch (err) {
    console.error("Aadhaar OTP verification error:", err);
    return res
      .status(500)
      .json({ message: "Server error. Please try again." });
  }
});

// ─── POST /api/verify/pan ─────────────────────────────────────────────────────
// Body: { pan: "ABCDE1234F", aadhaar_name: "..." }
// Cashfree: POST /verification/pan  → returns registered_name
router.post("/pan", rateLimiter, async (req, res) => {
  const { pan, aadhaar_name, token } = req.body;

  const PAN_REGEX = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
  if (!pan || !PAN_REGEX.test(pan.trim())) {
    return res.status(400).json({
      message: "Please enter a valid PAN (e.g. ABCDE1234F).",
    });
  }

  try {
    const cfRes = await fetch(`${CASHFREE_BASE}/pan`, {
      method: "POST",
      headers: CF_HEADERS,
      body: JSON.stringify({
        pan: pan.trim().toUpperCase(),
        name: aadhaar_name || "", // provide name for match scoring if available
      }),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok || cfData.valid === false || cfData.pan_status === "INVALID") {
      const msg =
        cfData?.message || cfData?.pan_status_desc || cfData?.error?.message || "PAN verification failed.";
      return res.status(cfRes.ok ? 400 : cfRes.status).json({ message: msg });
    }

    const panName =
      cfData?.registered_name ||
      cfData?.name_provided ||
      cfData?.name_pan_card ||
      cfData?.data?.registered_name ||
      null;

    if (!panName) {
      return res.status(400).json({
        message: "Could not retrieve name from PAN records. Please verify your PAN.",
      });
    }

    // Check if Aadhaar is linked to PAN
    const seedingStatus = cfData?.aadhaar_seeding_status;
    if (seedingStatus && seedingStatus === "R") {
      if (token) { await Record.updateOne({ token }, { $set: { kycFailed: true, kycFailedReason: "PAN not linked to Aadhaar" } }, { strict: false }); }
      return res.status(400).json({
        message: "Your PAN is not linked to your Aadhaar. Please link them and try again. Form cannot be opened.",
      });
    }

    // Compare names if aadhaar_name was provided
    let nameMatch = null;
    let nameMatchMessage = null;
    if (aadhaar_name) {
      nameMatch = namesMatch(aadhaar_name, panName);
      nameMatchMessage = nameMatch
        ? "Aadhaar name matches PAN name."
        : `Name mismatch: Aadhaar name "${aadhaar_name}" does not match PAN name "${panName}".`;
    }

    return res.json({
      success: true,
      pan_name: panName,
      name_match: nameMatch,
      name_match_message: nameMatchMessage,
      message: nameMatch === false ? nameMatchMessage : "PAN verified successfully.",
    });
  } catch (err) {
    console.error("PAN verification error:", err);
    return res
      .status(500)
      .json({ message: "Server error. Please try again." });
  }
});

module.exports = router;


