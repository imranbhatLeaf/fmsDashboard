const https = require("https");

function getSubject(doc) {
  const subjects = {
    Honorarium: `Honorarium Payment Notification — ${doc.services}`,
    Salary:     `Salary Credit Notification — ${doc.services}`,
    Fellowship: `Fellowship Disbursement Notification — ${doc.services}`,
    "TA/DA":    `TA/DA Reimbursement Notification — ${doc.services}`,
    Refund:     `Refund Processed — ${doc.services}`,
  };
  return subjects[doc.category] || `Payment Notification — ${doc.services}`;
}

function getBody(doc) {
  const name = doc.name;
  const service = doc.services;
  const amount = Number(doc.amount).toLocaleString("en-IN");
  const net = Number(doc.amountAfterTds).toLocaleString("en-IN");
  const tds = (Number(doc.amount) - Number(doc.amountAfterTds)).toLocaleString("en-IN");
  const formLink = `https://finance.asssr.org/form/${doc.token}`;

  const footer = `If you have any queries, please contact the accounts section.\n\nRegards,\nFinance & Accounts Team\n${service}`;

  switch (doc.category) {
    case "Honorarium":
      return `Dear ${name},\n\nAn honorarium of ₹${amount} has been approved for your services to ${service}.\n\nTDS Deducted (10%): ₹${tds}\nNet Amount: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "Salary":
      return `Dear ${name},\n\nYour salary has been processed by ${service}.\n\nGross: ₹${amount}\nTDS (10%): ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "Fellowship":
      return `Dear ${name},\n\nYour fellowship from ${service} has been processed.\n\nAmount: ₹${amount}\nTDS (10%): ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "TA/DA":
      return `Dear ${name},\n\nYour TA/DA reimbursement from ${service} has been approved.\n\nAmount: ₹${amount}\nTDS: ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "Refund":
      return `Dear ${name},\n\nA refund has been processed by ${service}.\n\nAmount: ₹${amount}\nTDS: ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    default:
      return `Dear ${name},\n\nA payment of ₹${net} has been processed by ${service}.\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
  }
}

async function sendEmail(doc) {
  const fromEmail = process.env.RESEND_FROM || "onboarding@resend.dev";
  const from = `${doc.services} Finance <${fromEmail}>`;
  const subject = getSubject(doc);
  const text = getBody(doc);

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "test" || process.env.RESEND_API_KEY === "") {
    console.log("----------------------------------------");
    console.log("[DEV MODE] Resend API Key is missing. Simulating Email Delivery.");
    console.log(`From: ${from}`);
    console.log(`To: ${doc.email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log("----------------------------------------");
    return Promise.resolve("Simulated email delivery successfully");
  }

  const body = JSON.stringify({
    from,
    to: [doc.email],
    subject,
    text,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.resend.com",
      path: "/emails",
      method: "POST",
      family: 4,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
      },
    }, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => { responseBody += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody);
        } else {
          reject(new Error(`Resend API error (${res.statusCode}): ${responseBody}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = { sendEmail };
