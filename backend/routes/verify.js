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

// Token similarity — abbreviation and word overlap score (0.0 – 1.0)
function nameSimilarity(a = "", b = "") {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1.0;
  if (!na || !nb) return 0.0;

  const arr1 = na.split(" ").filter(Boolean);
  const arr2 = nb.split(" ").filter(Boolean);
  if (arr1.length === 0 || arr2.length === 0) return 0.0;

  let matchScore = 0;
  let used2 = new Set();

  for (let w1 of arr1) {
    let bestScore = 0;
    let bestIdx = -1;
    for (let i = 0; i < arr2.length; i++) {
      if (used2.has(i)) continue;
      let w2 = arr2[i];
      let s = 0;
      if (w1 === w2) s = 1.0;
      else if (w1.length === 1 && w2.startsWith(w1)) s = 1.0;
      else if (w2.length === 1 && w1.startsWith(w2)) s = 1.0;
      else if (w2.startsWith(w1) || w1.startsWith(w2)) s = 0.9;

      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    if (bestIdx !== -1) { matchScore += bestScore; used2.add(bestIdx); }
  }

  const maxWords = Math.max(arr1.length, arr2.length);
  return matchScore / maxWords;
}

// Boolean convenience wrapper — threshold 60%
function namesMatch(a = "", b = "") {
  return nameSimilarity(a, b) >= 0.6;
}

// ─── 4-source name match (Payee × Aadhaar × PAN × Bank) ─────────────────────
function nameMatchAll4(payeeName, aadhaarName, panName, bankName) {
  const THRESHOLD = 0.6;

  const pairs = {
    payee_aadhaar: { a: payeeName,   b: aadhaarName },
    payee_pan:     { a: payeeName,   b: panName     },
    payee_bank:    { a: payeeName,   b: bankName    },
    aadhaar_pan:   { a: aadhaarName, b: panName     },
    aadhaar_bank:  { a: aadhaarName, b: bankName    },
    pan_bank:      { a: panName,     b: bankName    },
  };

  const result = {};
  let matchCount = 0;

  for (const [key, { a, b }] of Object.entries(pairs)) {
    const score = nameSimilarity(a, b);
    const ok = score >= THRESHOLD;
    if (ok) matchCount++;
    result[key] = { score: Math.round(score * 100), ok };
  }

  // HYPER-STRICT RULE: If the Admin provided a Payee Name, it MUST match ALL THREE official documents at 60% or higher!
  let payeeHasMatch = false;
  if (!payeeName || payeeName.trim() === "") {
    payeeHasMatch = true; // Waive if Admin left it blank
  } else {
    payeeHasMatch = result.payee_aadhaar.ok && result.payee_pan.ok && result.payee_bank.ok;
  }

  return {
    passed: matchCount >= 3 && payeeHasMatch,
    pairs: result,
    matchCount,
    totalPairs: 6,
  };
}

// ─── POST /api/verify/aadhaar/generate-otp ───────────────────────────────────
// Body: { aadhaar: "123456789012", token: "..." }
// Cashfree: POST /verification/offline-aadhaar/otp  -> returns ref_id
router.post("/aadhaar/generate-otp", rateLimiter, async (req, res) => {
  const { aadhaar, token } = req.body;

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
      // If Cashfree UIDAI times out but still sends the OTP and gives us a refId, 
      // we must treat it as success so the user can enter the OTP!
      const errorRefId = cfData?.error?.refId || cfData?.ref_id;
      if (errorRefId) {
        if (token) {
          await Record.updateOne({ token }, { $set: { kyc_aadhaar_ref_id: errorRefId } }, { strict: false });
        }
        return res.json({
          success: true,
          ref_id: errorRefId,
          message: cfData?.message || "OTP sent. Please enter it below.",
        });
      }

      const msg = cfData?.message || cfData?.error?.message || "Failed to send OTP. Please try again.";
      return res.status(cfRes.ok ? 400 : cfRes.status).json({ message: msg });
    }

    if (token && cfData.ref_id) {
      await Record.updateOne({ token }, { $set: { kyc_aadhaar_ref_id: cfData.ref_id } }, { strict: false });
    }

    return res.json({
      success: true,
      ref_id: cfData.ref_id,
      message: "OTP sent to your Aadhaar-registered mobile number.",
    });
  } catch (err) {
    console.error("Aadhaar OTP generation error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── POST /api/verify/aadhaar/verify-otp ─────────────────────────────────────
// Body: { ref_id: "...", otp: "123456", token: "..." }
// Cashfree: POST /verification/offline-aadhaar/verify -> returns name, dob, etc.
// Persists KYC state to DB so page refresh doesn't re-charge Cashfree.
router.post("/aadhaar/verify-otp", rateLimiter, async (req, res) => {
  const { ref_id, otp, token } = req.body;

  if (!ref_id || !otp) {
    return res.status(400).json({ message: "OTP and reference ID are required." });
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    return res.status(400).json({ message: "OTP must be exactly 6 digits." });
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

    // ── Persist to DB so refresh doesn't re-charge ────────────────────────────
    if (token) {
      await Record.updateOne(
        { token },
        { $set: { kyc_aadhaar_verified: true, kyc_aadhaar_name: aadhaarName } },
        { strict: false }
      );
    }

    return res.json({
      success: true,
      aadhaar_name: aadhaarName,
      message: "Aadhaar verified successfully.",
    });
  } catch (err) {
    console.error("Aadhaar OTP verification error:", err);

    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── POST /api/verify/pan ─────────────────────────────────────────────────────
// Body: { pan: "ABCDE1234F", aadhaar_name: "...", token: "..." }
// Cashfree: POST /verification/pan  -> returns registered_name
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
        name: aadhaar_name || "",
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
      if (token) {
        await Record.updateOne(
          { token },
          { $set: { kycFailed: true, kycFailedReason: "PAN not linked to Aadhaar" } },
          { strict: false }
        );
      }
      return res.status(400).json({
        message: "Your PAN is not linked to your Aadhaar. Please link them and try again. Form cannot be opened.",
      });
    }

    // Compare Aadhaar name vs PAN name
    let nameMatch = null;
    let nameMatchScore = null;
    let nameMatchMessage = null;
    if (aadhaar_name) {
      const score = nameSimilarity(aadhaar_name, panName);
      nameMatch = score >= 0.6;
      nameMatchScore = Math.round(score * 100);
      nameMatchMessage = nameMatch
        ? `Aadhaar name matches PAN name (${nameMatchScore}% similarity).`
        : `Name mismatch: Aadhaar "${aadhaar_name}" vs PAN "${panName}" (${nameMatchScore}% similarity).`;
    }

    // ── Persist PAN to DB ─────────────────────────────────────────────────────
    if (token && panName) {
      await Record.updateOne(
        { token },
        { 
          $set: { 
            kyc_pan_verified: true, 
            kyc_pan_name: panName,
            kyc_pan_number: pan,
            kyc_pan_match_score: nameMatchScore 
          } 
        },
        { strict: false }
      );
    }

    return res.json({
      success: true,
      pan_name: panName,
      name_match: nameMatch,
      name_match_score: nameMatchScore,
      name_match_message: nameMatchMessage,
      message: nameMatch === false ? nameMatchMessage : "PAN verified successfully.",
    });
  } catch (err) {
    console.error("PAN verification error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── POST /api/verify/bank ────────────────────────────────────────────────────
// Body: { account_number, ifsc, payee_name, aadhaar_name, pan_name }
// Cashfree: POST /verification/bank-account/sync
// Runs 4-source name match: Payee × Aadhaar × PAN × Bank (6 pairs, pass if >= 3/6 >= 60%).
router.post("/bank", rateLimiter, async (req, res) => {
  const { account_number, ifsc, payee_name, aadhaar_name, pan_name } = req.body;

  if (!account_number || !/^[0-9]{6,}$/.test(account_number.trim())) {
    return res.status(400).json({
      message: "Please enter a valid bank account number (at least 6 digits).",
    });
  }

  if (!ifsc || !/^[A-Za-z0-9]{6,11}$/.test(ifsc.trim())) {
    return res.status(400).json({
      message: "Please enter a valid IFSC code.",
    });
  }

  try {
    const cfRes = await fetch(`${CASHFREE_BASE}/bank-account/sync`, {
      method: "POST",
      headers: CF_HEADERS,
      body: JSON.stringify({
        bank_account: account_number.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        name: aadhaar_name || payee_name || pan_name || "",
      }),
    });

    const cfData = await cfRes.json();

    const accountStatus =
      cfData?.account_status ||
      cfData?.data?.account_status ||
      cfData?.status ||
      "";

    if (!cfRes.ok || accountStatus === "INVALID") {
      const msg =
        cfData?.message ||
        cfData?.error?.message ||
        "Bank account verification failed. Please check your account number and IFSC.";
      return res.status(cfRes.ok ? 400 : cfRes.status).json({ message: msg });
    }

    // Extract bank-registered name
    const bankName =
      cfData?.name_at_bank ||
      cfData?.data?.name_at_bank ||
      cfData?.registered_name ||
      cfData?.data?.registered_name ||
      cfData?.account_name ||
      cfData?.data?.account_name ||
      null;

    if (!bankName) {
      return res.status(400).json({
        message: "Could not retrieve account holder name from bank. Please verify your details.",
      });
    }

    // 4-source match: Payee × Aadhaar × PAN × Bank (6 pairs, need >= 3/6)
    let matchResult = null;
    if (payee_name && aadhaar_name && pan_name) {
      matchResult = nameMatchAll4(payee_name, aadhaar_name, pan_name, bankName);
    } else if (aadhaar_name && pan_name) {
      // fallback if payee_name not sent
      matchResult = nameMatchAll4("", aadhaar_name, pan_name, bankName);
    }

    // ── Persist Bank & Overall KYC to DB ──────────────────────────────────────
    if (req.body.token && bankName) {
      const overallPassed = matchResult ? matchResult.passed : false;
      await Record.updateOne(
        { token: req.body.token },
        { 
          $set: { 
            kyc_bank_verified: true,
            kyc_bank_name: bankName,
            kyc_bank_account: account_number.trim(),
            kyc_bank_ifsc: ifsc.trim().toUpperCase(),
            kyc_bank_match: matchResult,
            kyc_passed: overallPassed,
            ...(overallPassed ? { kyc_passed_at: new Date() } : {})
          } 
        },
        { strict: false }
      );
    }

    return res.json({
      success: true,
      bank_name: bankName,
      account_status: accountStatus,
      match: matchResult,
      message: matchResult
        ? (matchResult.passed
            ? `Bank verified. Name match passed.`
            : `Name mismatch: The Admin-entered Payee Name must match ALL of your official documents (Aadhaar, PAN, and Bank). Please contact accounts to correct your name.`)
        : "Bank account verified successfully.",
    });
  } catch (err) {
    console.error("Bank account verification error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

module.exports = router;
