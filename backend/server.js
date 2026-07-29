require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const connectDB = require("./config/db");
const recordsRouter = require("./routes/records");
const uploadRouter = require("./routes/upload");
const formRouter = require("./routes/form");
const authRouter = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRouter);
app.use("/api/records", recordsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/form", formRouter);

// Diagnostic endpoint — test SMTP config live on the server
app.get("/api/test-email", async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).json({ error: "Pass ?to=your@email.com" });

  const cfg = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? "✓ set (" + process.env.SMTP_PASS.length + " chars)" : "✗ MISSING",
    SMTP_FROM: process.env.SMTP_FROM,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: "SMTP credentials missing on this server", config: cfg });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.resend.com",
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "false" ? false : true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: `Finance Test <${process.env.SMTP_FROM}>`,
      to,
      subject: "FMS Email Diagnostic Test",
      text: "This is a diagnostic test from the FMS server. If you received this, SMTP is working correctly.",
    });

    return res.json({ success: true, messageId: info.messageId, config: cfg });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, config: cfg });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

