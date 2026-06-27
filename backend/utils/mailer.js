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
  const formLink = `http://51.79.173.103:5173/form/${doc.token}`;

  const footer = `If you have any queries, please contact the accounts section.\n\nRegards,\nFinance & Accounts Team\n${service}`;

  switch (doc.category) {
    case "Honorarium":
      return `Dear ${name},\n\nAn honorarium of ₹${amount} has been approved for your services to ${service}.\n\nTDS Deducted (10%): ₹${tds}\nNet Amount: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "Salary":
      return `Dear ${name},\n\nYour salary has been processed by ${service}.\n\nGross: ₹${amount}\nTDS (10%): ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "Fellowship":
      return `Dear ${name},\n\nYour fellowship from ${service} has been processed.\n\nAmount: ₹${amount}\nTDS (10%): ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "TA/DA":
      return `Dear ${name},\n\nYour TA/DA reimbursement from ${service} has been approved.\n\nAmount: ₹${amount}\nTDS (10%): ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    case "Refund":
      return `Dear ${name},\n\nA refund has been processed by ${service}.\n\nAmount: ₹${amount}\nTDS (10%): ₹${tds}\nNet: ₹${net}\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
    default:
      return `Dear ${name},\n\nA payment of ₹${net} has been processed by ${service}.\n\nPlease fill your details here:\n${formLink}\n\n${footer}`;
  }
}

async function sendEmail(doc) {
  const body = JSON.stringify({
    sender: { name: `${doc.services} Finance`, email: process.env.SMTP_USER },
    to: [{ email: doc.email, name: doc.name }],
    subject: getSubject(doc),
    textContent: getBody(doc),
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
    }, (res) => {
      res.on("data", () => {});
      res.on("end", resolve);
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = { sendEmail };
