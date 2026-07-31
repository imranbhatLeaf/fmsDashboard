require("dotenv").config();
const nodemailer = require("nodemailer");

async function test() {
  console.log("Starting email test...");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_FROM:", process.env.SMTP_FROM);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === "false" ? false : true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `Test Finance <${process.env.SMTP_FROM || 'noreply@finance.asssr.org'}>`,
      to: "imranbhat99444@gmail.com", // testing to see if it goes through
      subject: "FMS Email Test",
      text: "This is a test of the Resend SMTP setup.",
    });
    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (error) {
    console.error("Failed to send email. Error:", error);
  }
}

test();
