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

// Legacy Aadhaar OKYC headers without x-api-version to prevent version routing mismatch
const AADHAAR_HEADERS = {
  "x-client-id": process.env.CASHFREE_CLIENT_ID,
  "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
  "Content-Type": "application/json",
};

// ─── Rate Limiting (shared simple in-memory store) ───────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 60; // 60 requests per 15 min per IP to prevent locking shared networks

function rateLimiter(req, res, next) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress || "0.0.0.0").trim();
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
  return String(name || "")
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

  // Check if one name contains the other as exact words or with initials (e.g. "Joy K" vs "Joy")
  const shorter = arr1.length <= arr2.length ? arr1 : arr2;
  const longer = arr1.length <= arr2.length ? arr2 : arr1;
  const allShorterInLonger = shorter.every(w => longer.includes(w));
  if (allShorterInLonger) {
    const extraWords = longer.filter(w => !shorter.includes(w));
    // If extra words are just initials (1-2 chars) or empty
    const onlyInitials = extraWords.every(w => w.length <= 2);
    if (onlyInitials) {
      return 0.9; // Strong match (90%) for "Joy K" vs "Joy"!
    }
  }

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

  const minWords = Math.min(arr1.length, arr2.length);
  const maxWords = Math.max(arr1.length, arr2.length);

  // If all words of the shorter name matched:
  if (matchScore >= minWords) {
    return Math.max(0.75, matchScore / maxWords);
  }

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
    let cfRes, cfData;
    const MAX_GENERATE_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_GENERATE_RETRIES; attempt++) {
      cfRes = await fetch(`${CASHFREE_BASE}/offline-aadhaar/otp`, {
        method: "POST",
        headers: AADHAAR_HEADERS,
        body: JSON.stringify({ aadhaar_number: aadhaar.trim() }),
      });

      cfData = await cfRes.json().catch(() => ({}));
      console.log(`Cashfree generate-otp attempt ${attempt}/${MAX_GENERATE_RETRIES} status:`, cfRes.status, "data:", cfData);

      const isUnavailable =
        cfRes.status === 502 ||
        cfRes.status === 503 ||
        cfRes.status === 504 ||
        cfData?.message?.toLowerCase().includes("unavailable") ||
        cfData?.error?.message?.toLowerCase().includes("unavailable") ||
        cfData?.code === "source_unavailable" ||
        cfData?.message?.toLowerCase().includes("bad gateway");

      if (isUnavailable && attempt < MAX_GENERATE_RETRIES) {
        console.log(`UIDAI temporarily unavailable during OTP generation. Retrying in 2.5s (attempt ${attempt + 1}/${MAX_GENERATE_RETRIES})...`);
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
      break;
    }

    const isUnavailable =
      cfRes.status === 502 ||
      cfRes.status === 503 ||
      cfRes.status === 504 ||
      cfData?.message?.toLowerCase().includes("unavailable") ||
      cfData?.error?.message?.toLowerCase().includes("unavailable") ||
      cfData?.code === "source_unavailable" ||
      cfData?.message?.toLowerCase().includes("bad gateway");

    if (!cfRes.ok || cfData.status === "INVALID" || cfData.status === "FAILED" || isUnavailable) {
      if (isUnavailable) {
        return res.status(503).json({
          retryable: true,
          message: "UIDAI (Government Aadhaar server) is temporarily busy. Please wait a few seconds and try clicking 'Send OTP' again.",
        });
      }
      const msg = cfData?.message || cfData?.error?.message || "Failed to send OTP. Please try again.";
      return res.status(cfRes.ok ? 400 : cfRes.status).json({
        message: msg,
        ref_id: cfData?.ref_id ? String(cfData.ref_id) : undefined,
      });
    }

    if (token && cfData.ref_id) {
      const record = await Record.findOne({ $or: [{ token: new RegExp(`^${token}$`, "i") }, { payee_link_token: new RegExp(`^${token}$`, "i") }, { utr_rrn_reference_number: new RegExp(`^${token}$`, "i") }] });
      if (record) {
        await Record.updateOne({ _id: record._id }, { $set: { kyc_aadhaar_ref_id: String(cfData.ref_id), kyc_aadhaar_number: aadhaar.trim() } }, { strict: false });
      }
    }

    return res.json({
      success: true,
      ref_id: String(cfData.ref_id),
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
// UIDAI takes 10-25 seconds to process Aadhaar OTP. We use a 45-second timeout.
// If Cashfree returns 409 (verification_pending), we poll GET /offline-aadhaar/:ref_id.
router.post("/aadhaar/verify-otp", rateLimiter, async (req, res) => {
  const { ref_id, otp, token } = req.body;

  if (!ref_id || !otp) {
    return res.status(400).json({ message: "OTP and reference ID are required." });
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    return res.status(400).json({ message: "OTP must be exactly 6 digits." });
  }

  try {
    const cleanRefId = String(ref_id).trim();
    const cleanOtp = String(otp).trim();

    // 45-second timeout for UIDAI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let cfRes, cfData;
    try {
      cfRes = await fetch(`${CASHFREE_BASE}/offline-aadhaar/verify`, {
        method: "POST",
        headers: AADHAAR_HEADERS,
        body: JSON.stringify({ otp: cleanOtp, ref_id: cleanRefId }),
        signal: controller.signal,
      });
      cfData = await cfRes.json().catch(() => ({}));
      console.log("Cashfree verify-otp status:", cfRes.status, cfData);
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        return res.status(503).json({
          retryable: true,
          message: "UIDAI (Government Aadhaar server) took too long to respond. Please click 'Resend OTP' to try again.",
        });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    console.log("Cashfree verify-otp initial status:", cfRes.status, cfData);

    // If Cashfree returns 409 (verification_pending), UIDAI is processing in the background.
    // Poll Cashfree GET /offline-aadhaar/:ref_id every 3 seconds (up to 6 times = 18s).
    if (cfRes.status === 409 || cfData?.code === "verification_pending" || cfData?.message?.includes("Processing request")) {
      console.log("Cashfree returned verification_pending (409). Polling GET /offline-aadhaar/" + cleanRefId + "...");
      for (let poll = 1; poll <= 6; poll++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const pollRes = await fetch(`${CASHFREE_BASE}/offline-aadhaar/${cleanRefId}`, {
            method: "GET",
            headers: AADHAAR_HEADERS,
          });
          const pollData = await pollRes.json().catch(() => ({}));
          const polledName = pollData?.data?.name || pollData?.name || pollData?.full_name;
          console.log(`Poll attempt ${poll}/6 — status:`, pollRes.status, pollData?.status, polledName);
          if (polledName && typeof polledName === "string" && polledName.trim() !== "") {
            cfRes = { ok: true, status: 200 };
            cfData = pollData;
            break;
          }
          if (pollData?.status === "VERIFICATION_FAILED" || pollData?.status === "FAILED") {
            cfRes = { ok: false, status: 400 };
            cfData = pollData;
            break;
          }
        } catch (pollErr) {
          console.warn("Poll attempt error:", pollErr);
        }
      }
    }

    console.log("Cashfree verify-otp final status:", cfRes.status, cfData);

    if (!cfRes.ok || cfData.status === "INVALID" || cfData.status === "FAILED" || cfData.status === "VERIFICATION_FAILED") {
      let msg = cfData?.message || cfData?.error?.message || "Invalid OTP. Please try again.";

      // Case 1: Gateway / unavailability error from UIDAI
      const isGatewayError =
        cfRes.status === 502 ||
        cfRes.status === 503 ||
        cfRes.status === 504 ||
        msg.toLowerCase().includes("unavailable") ||
        cfData?.code === "source_unavailable" ||
        msg.toLowerCase().includes("bad gateway");

      if (isGatewayError) {
        return res.status(503).json({
          retryable: true,
          message: "UIDAI (Government Aadhaar server) is temporarily busy. Your OTP is still valid — please wait 5-10 seconds and click 'Verify OTP' again.",
        });
      }

      // Case 2: Session expired (OTP timeout, invalid ref, or already consumed)
      const isSessionExpired =
        msg.toLowerCase().includes("session expired") ||
        msg.toLowerCase().includes("otp expired") ||
        msg.toLowerCase().includes("session timed out") ||
        msg.toLowerCase().includes("reference id expired") ||
        msg.toLowerCase().includes("invalid ref_id") ||
        msg.toLowerCase().includes("invalid reference") ||
        msg.toLowerCase().includes("request has expired") ||
        cfData?.code === "session_expired" ||
        cfData?.code === "otp_expired";

      if (isSessionExpired) {
        // Clear stale ref_id from DB so page refresh doesn't restore a dead OTP session
        if (token) {
          try {
            const record = await Record.findOne({ $or: [{ token: new RegExp(`^${token}$`, "i") }, { payee_link_token: new RegExp(`^${token}$`, "i") }, { utr_rrn_reference_number: new RegExp(`^${token}$`, "i") }] });
            if (record) {
              await Record.updateOne({ _id: record._id }, { $unset: { kyc_aadhaar_ref_id: "" } }, { strict: false });
            }
          } catch (_) { /* non-fatal */ }
        }
        return res.status(400).json({
          sessionExpired: true,
          message: "⏱ OTP session has expired. Please click 'Resend OTP' to receive a new OTP.",
        });
      }

      // Case 3: Still pending after polling
      if (cfRes.status === 409 || cfData?.code === "verification_pending" || msg.includes("Processing request")) {
        return res.status(503).json({
          retryable: true,
          message: "UIDAI server is taking longer than usual to complete verification. Your OTP is still valid — please click 'Verify OTP' again in a few seconds.",
        });
      }

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
      const record = await Record.findOne({ $or: [{ token: new RegExp(`^${token}$`, "i") }, { payee_link_token: new RegExp(`^${token}$`, "i") }, { utr_rrn_reference_number: new RegExp(`^${token}$`, "i") }] });
      if (record) {
        await Record.updateOne(
          { _id: record._id },
          { $set: { kyc_aadhaar_verified: true, kyc_aadhaar_name: aadhaarName } },
          { strict: false }
        );
      }
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


// ─── KYC Lock Helper ────────────────────────────────────────────────────────
// For INVALID PAN/Bank (genuinely wrong format/non-existent): 2 attempts then lock permanently (no time delays).
// For NAME MISMATCH (different person's valid docs): route to admin, don't lock.
async function applyInvalidDocLock(token, record, type) {
  if (!record || !token) return { locked: false, message: null };
  const fieldKey = type === "pan" ? "pan_invalid_attempts" : "bank_invalid_attempts";
  const attempts = (record[fieldKey] || 0) + 1;

  await Record.updateOne(
    { _id: record._id },
    { $set: { [fieldKey]: attempts } },
    { strict: false }
  );

  if (attempts >= 2) {
    // Lock permanently after 2 invalid attempts
    await Record.updateOne(
      { _id: record._id },
      { $set: { kyc_permanently_locked: true } },
      { strict: false }
    );
    return {
      locked: true,
      message: `Too many invalid ${type === "pan" ? "PAN" : "bank"} attempts. This form has been permanently locked. Please contact the accounts section.`,
    };
  }

  const remaining = 2 - attempts;
  return {
    locked: false,
    message: `Invalid ${type === "pan" ? "PAN" : "bank"} details. You have ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before this form is locked.`,
  };
}

// For name mismatches (different person's docs) — route to admin, do NOT lock
async function applyNameMismatchFlag(record, type, details) {
  if (!record) return;
  const now = new Date();
  await Record.updateOne(
    { _id: record._id },
    {
      $set: {
        kyc_name_mismatch: true,
        kyc_name_mismatch_type: type,
        kyc_name_mismatch_details: details,
        admin_review_requested: true,
        admin_review_reason: `Name mismatch at ${type} step: ${details}`,
        kyc_name_mismatch_at: now,
      }
    },
    { strict: false }
  );
}

function checkKycLock(record) {
  if (!record) return null;
  if (record.kyc_permanently_locked) return "This form has been permanently locked due to too many failed attempts. Please contact the accounts section.";
  // No time-based locks anymore — removed 24h/48h logic
  return null;
}

// ─── POST /api/verify/pan ─────────────────────────────────────────────────────
// Body: { pan: "ABCDE1234F", aadhaar_name: "...", token: "..." }
// Cashfree: POST /verification/pan  -> returns registered_name
router.post("/pan/request-review", rateLimiter, async (req, res) => {
  try {
    const { token, pan } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required." });
    
    const record = await Record.findOne({ token: new RegExp('^' + token + '$', 'i') });
    if (!record) return res.status(404).json({ message: "Record not found." });

    record.admin_review_requested = true;
    record.admin_review_reason = "PAN not linked with Aadhaar";
    if (pan) record.kyc_pan_number = pan.trim().toUpperCase(); // save attempted PAN for display on refresh
    await record.save();

    return res.json({ message: "Admin review requested successfully. Please wait for approval." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/pan", rateLimiter, async (req, res) => {
  const { pan, aadhaar_name, token } = req.body;

  const PAN_REGEX = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
  if (!pan || !PAN_REGEX.test(pan.trim())) {
    return res.status(400).json({ message: "Please enter a valid PAN (e.g. ABCDE1234F)." });
  }

  let record = null;
  if (token) {
    record = await Record.findOne({ $or: [{ token: new RegExp(`^${token}$`, "i") }, { payee_link_token: new RegExp(`^${token}$`, "i") }, { utr_rrn_reference_number: new RegExp(`^${token}$`, "i") }] });
    const lockMsg = checkKycLock(record);
    if (lockMsg) return res.status(403).json({ message: lockMsg });
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

      const isUnlinkedError =
        msg.toLowerCase().includes("not linked") ||
        msg.toLowerCase().includes("aadhaar not seeded") ||
        msg.toLowerCase().includes("seeding") ||
        cfData?.aadhaar_seeding_status === "R" ||
        cfData?.aadhaar_seeding_status === "N";

      if (isUnlinkedError && token && record) {
        await Record.updateOne(
          { _id: record._id },
          { 
            $set: { 
              kyc_pan_verified: true,
              kyc_pan_name: aadhaar_name || record.name,
              kyc_pan_number: pan.trim().toUpperCase(),
              kyc_pan_match_score: 100,
              admin_review_requested: true, 
              admin_review_reason: "PAN not linked to Aadhaar",
              pan_not_linked: true,
              pan_aadhaar_linked: false
            } 
          },
          { strict: false }
        );
        return res.json({
          success: true,
          pan_name: aadhaar_name || record.name,
          name_match: true,
          name_match_score: 100,
          name_match_message: "PAN accepted. Aadhaar is not linked with PAN.",
          pan_not_linked: true,
          pan_aadhaar_linked: false,
          aadhaar_seeding_status: cfData?.aadhaar_seeding_status || "R",
          message: "Your Aadhaar is not linked with this PAN. You can proceed to submit the form; it will be sent to Admin for review.",
        });
      }

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
    const isPanNotLinked =
      seedingStatus === "R" ||
      seedingStatus === "N" ||
      seedingStatus === "NOT_LINKED" ||
      cfData?.pan_status === "INOPERATIVE";

    if (isPanNotLinked) {
      if (record) {
        await Record.updateOne(
          { _id: record._id },
          { 
            $set: { 
              admin_review_requested: true, 
              admin_review_reason: "PAN not linked to Aadhaar",
              pan_not_linked: true,
              pan_aadhaar_linked: false
            } 
          },
          { strict: false }
        );
        record.admin_review_requested = true;
        record.admin_review_reason = "PAN not linked to Aadhaar";
        record.pan_not_linked = true;
        record.pan_aadhaar_linked = false;
      }
    } else if (record && (seedingStatus === "Y" || seedingStatus === "LINKED")) {
      await Record.updateOne(
        { _id: record._id },
        { 
          $set: { 
            pan_not_linked: false,
            pan_aadhaar_linked: true,
            admin_review_requested: false,
            admin_review_reason: null
          } 
        },
        { strict: false }
      );
      record.pan_not_linked = false;
      record.pan_aadhaar_linked = true;
      record.admin_review_requested = false;
      record.admin_review_reason = null;
    }

    // Compare Aadhaar name vs PAN name
    let nameMatch = null;
    let nameMatchScore = null;
    let nameMatchMessage = null;
    let nameMismatchDifferentPerson = false;

    if (aadhaar_name) {
      const score = nameSimilarity(aadhaar_name, panName);
      nameMatch = score >= 0.6;
      nameMatchScore = Math.round(score * 100);
      nameMatchMessage = nameMatch
        ? `Aadhaar name matches PAN name (${nameMatchScore}% similarity).`
        : `Name mismatch: Aadhaar "${aadhaar_name}" vs PAN "${panName}" (${nameMatchScore}% similarity).`;

      // Check if Payee Name matches — if not, flag as different person (route to admin, don't lock)
      if (record && record.name && record.name.trim() !== "") {
        const payeeAadhaarScore = nameSimilarity(record.name, aadhaar_name);
        const payeePanScore = nameSimilarity(record.name, panName);

        if (payeeAadhaarScore < 0.6 || payeePanScore < 0.6) {
          // Different person's documents — flag for admin review, allow form to proceed
          nameMismatchDifferentPerson = true;
          nameMatchMessage = `The name on your documents ("${panName}") does not match the Payee Name ("${record.name}") on record. This form will be sent to Admin for review. You may proceed.`;
        }
      }
    }

    // ── Persist PAN to DB ─────────────────────────────────────────────────────
    if (token && panName) {
      // Name match between Aadhaar and PAN failed completely (e.g. clearly invalid/wrong PAN)
      if (nameMatch === false && !nameMismatchDifferentPerson) {
        const lockResult = await applyInvalidDocLock(token, record, "pan");
        if (lockResult.locked) {
          return res.status(403).json({ message: lockResult.message });
        }
        // Not locked yet — allow retry, show warning
        return res.status(400).json({ message: lockResult.message, pan_mismatch: true });
      }

      const updateFields = {
        kyc_pan_verified: true,
        kyc_pan_name: panName,
        kyc_pan_number: pan,
        kyc_pan_match_score: nameMatchScore,
        pan_not_linked: isPanNotLinked,
        pan_aadhaar_linked: !isPanNotLinked,
      };

      // If different person's docs — flag for admin review
      if (nameMismatchDifferentPerson) {
        await applyNameMismatchFlag(record, "pan", nameMatchMessage);
        updateFields.kyc_pan_verified = true; // still allow form to proceed
        updateFields.kyc_name_mismatch = true;
        // Allow form to proceed to bank step
        nameMatch = true;
      }

      await Record.updateOne(
        { _id: record._id },
        { $set: updateFields },
        { strict: false }
      );
    }

    return res.json({
      success: true,
      pan_name: panName,
      name_match: nameMatch ?? true,
      name_match_score: nameMatchScore,
      name_match_message: nameMatchMessage,
      name_mismatch_different_person: nameMismatchDifferentPerson,
      pan_not_linked: isPanNotLinked,
      pan_aadhaar_linked: !isPanNotLinked,
      aadhaar_seeding_status: seedingStatus,
      message: nameMismatchDifferentPerson
        ? "⚠️ The documents you provided belong to a different person. This form will be routed to Admin for review. You may proceed to fill and submit."
        : isPanNotLinked
        ? "PAN verified. Note: Your Aadhaar is not linked with PAN. You can proceed with the form; it will be sent to Admin for review."
        : "PAN verified successfully.",
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
  const { account_number, ifsc, payee_name, aadhaar_name, pan_name, token } = req.body;

  if (!account_number || !/^[0-9]{6,}$/.test(account_number.trim())) {
    return res.status(400).json({ message: "Please enter a valid bank account number (at least 6 digits)." });
  }
  if (!ifsc || !/^[A-Za-z0-9]{6,11}$/.test(ifsc.trim())) {
    return res.status(400).json({ message: "Please enter a valid IFSC code." });
  }

  let record = null;
  if (token) {
    record = await Record.findOne({ $or: [{ token: new RegExp(`^${token}$`, "i") }, { payee_link_token: new RegExp(`^${token}$`, "i") }, { utr_rrn_reference_number: new RegExp(`^${token}$`, "i") }] });
    const lockMsg = checkKycLock(record);
    if (lockMsg) return res.status(403).json({ message: lockMsg });
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
    const accountStatus = cfData?.account_status || cfData?.data?.account_status || cfData?.status || "";

    if (!cfRes.ok || accountStatus === "INVALID") {
      // Invalid bank account — apply 2-attempt lock
      if (token && record) {
        const lockResult = await applyInvalidDocLock(token, record, "bank");
        if (lockResult.locked) {
          return res.status(403).json({ message: lockResult.message });
        }
        return res.status(400).json({ message: lockResult.message, bank_invalid: true });
      }
      const msg = cfData?.message || cfData?.error?.message || "Bank account verification failed. Please check your account number and IFSC.";
      return res.status(cfRes.ok ? 400 : cfRes.status).json({ message: msg });
    }

    const bankName = cfData?.name_at_bank || cfData?.data?.name_at_bank || cfData?.registered_name || cfData?.data?.registered_name || cfData?.account_name || cfData?.data?.account_name || null;

    if (!bankName) {
      return res.status(400).json({ message: "Could not retrieve account holder name from bank. Please verify your details." });
    }

    let matchResult = null;
    if (payee_name && aadhaar_name && pan_name) {
      matchResult = nameMatchAll4(payee_name, aadhaar_name, pan_name, bankName);
    } else if (aadhaar_name && pan_name) {
      matchResult = nameMatchAll4("", aadhaar_name, pan_name, bankName);
    }

    // Determine if this is a different-person mismatch or just a valid mismatch
    const overallPassed = matchResult ? matchResult.passed : false;
    const isBankDifferentPerson = !overallPassed && matchResult !== null;

    if (token && bankName) {
      const updateFields = {
        kyc_bank_verified: true,
        kyc_bank_name: bankName,
        kyc_bank_account: account_number.trim(),
        kyc_bank_ifsc: ifsc.trim().toUpperCase(),
        kyc_bank_match: matchResult,
        // Always mark kyc_passed true so the form can be submitted to admin
        kyc_passed: true,
        kyc_passed_at: new Date(),
      };

      if (isBankDifferentPerson) {
        // Name mismatch — flag for admin review, don't lock
        await applyNameMismatchFlag(record, "bank", `Bank name "${bankName}" did not fully match Payee/Aadhaar/PAN names`);
        updateFields.kyc_name_mismatch = true;
        updateFields.admin_review_requested = true;
        // Force matchResult.passed so frontend allows submission
        if (matchResult) matchResult = { ...matchResult, passed: true, mismatch_flagged_for_admin: true };
      }

      await Record.updateOne(
        { _id: record._id },
        { $set: updateFields },
        { strict: false }
      );
    }

    return res.json({
      success: true,
      bank_name: bankName,
      account_status: accountStatus,
      match: matchResult ? { ...matchResult, passed: true } : matchResult,
      bank_mismatch_different_person: isBankDifferentPerson,
      message: isBankDifferentPerson
        ? `⚠️ Bank account name ("${bankName}") does not fully match. This form will be sent to Admin for review. You may proceed to submit.`
        : `Bank verified. Name match passed.`,
    });
  } catch (err) {
    console.error("Bank account verification error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

module.exports = router;



