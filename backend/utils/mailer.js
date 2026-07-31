const nodemailer = require("nodemailer");

function getSubject(doc, stage = 1) {
  const paymentType = doc.category;
  if (stage === 1) {
    return `Submission of Bank Account Details for Processing of Payment against ${paymentType} -- reg.`;
  } else if (stage === 2) {
    return `Unique Transfer Reference Number (UTRN) for Tracking of ${paymentType} -- reg.`;
  } else if (stage === 3) {
    return `Payment Advice Number & UTRN and Transaction Date in respect of release ${paymentType} -- reg.`;
  } else if (stage === 4) {
    return `Resubmission of Bank Details Required for Processing of Payment against ${paymentType} -- reg.`;
  }
  return `Payment Notification — ${doc.services}`;
}

function getHtmlSubject(doc, stage = 1) {
  const paymentType = `<i>${doc.category}</i>`;
  if (stage === 1) {
    return `Submission of Bank Account Details for Processing of Payment against ${paymentType} -- reg.`;
  } else if (stage === 2) {
    return `Unique Transfer Reference Number (UTRN) for Tracking of ${paymentType} -- reg.`;
  } else if (stage === 3) {
    return `Payment Advice Number & UTRN and Transaction Date in respect of release ${paymentType} -- reg.`;
  } else if (stage === 4) {
    return `Resubmission of Bank Details Required for Processing of Payment against ${paymentType} -- reg.`;
  }
  return `Payment Notification — ${doc.services}`;
}

function getBody(doc, stage = 1) {
  const name = doc.name;
  const paymentType = doc.category;
  const utrn = doc.bankReferenceNo || doc.utr_rrn_reference_number || "Pending";
  const formLink = `https://finance.asssr.org/form/${doc.token}`;
  
  let content = "";
  if (stage === 1) {
    content = `We are pleased to inform you that the ${paymentType} portal is open via ARMS for submission of bank account details for processing of your payment.

Please use the secure link below to submit your details. This link is valid for 45 days only. Upon submission, a Unique Transfer Reference Number (UTRN) will be generated for your tracking.

Link: ${formLink}

Important Points:
- Please ensure the accuracy of the bank details provided.
- The Office of Finance holds no liability for payments credited to incorrect accounts due to user-provided errors.
- The submission link is valid for 45 days. After this period, the link will expire and no further claims will be entertained.`;
  } else if (stage === 2) {
    content = `This is to confirm that your bank details for ${paymentType} have been successfully submitted via the AFMS portal.

Your Unique Transfer Reference Number (UTRN) for tracking this transaction is: ${utrn}.

You can track the status of your payment using the following link: ${formLink}

Please note that the remittance process typically takes 45-60 working days (excluding weekends and holidays).`;
  } else if (stage === 3) {
    const ifsc = doc.ifsc_code || "N/A";
    const beneficiary = doc.beneficiary_name || name;
    const account = doc.account_number || "N/A";
    const refNo = doc.receiptNumber || utrn;
    const paymentDate = doc.dateOfTransfer ? new Date(doc.dateOfTransfer).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    const amount = Number(doc.amountAfterTds || doc.amount).toFixed(2);
    
    content = `We are pleased to inform you that the payment against ${paymentType} under UTRN ${utrn} has been successfully released via AFMS from State Bank of India, Saket Branch, New Delhi-17, Branch Code 08442.

The transaction details are as follows:
IFSC Code: ${ifsc}
Beneficiary Details: ${beneficiary}
Bank Account No.: ${account}
Ref. No. & Date: ${refNo} & ${paymentDate}
Amount: ₹${amount}

With this, the matter is settled and closed.`;
  } else if (stage === 4) {
    const rejectionReason = doc.rejectionReason || "No reason provided";
    content = `We regret to inform you that your ${paymentType} payment request has been rejected.

Reason for Rejection: ${rejectionReason}

If you believe this is an error or require further clarification, please contact the accounts section at finance@asssr.org.

Note: Please do not use the previous submission link as it is no longer valid.`;
  }

  return `[Please do not reply to this mail as this is an automated mail service.]

Dear ${name},

Greetings from Finance!

${content}

With kind regards,
O/o Finance
On behalf of Asiatic Society for Social Science Research and its Components

Print this mail only if absolutely necessary. Save Paper!! Save Trees!!
====================================================
Disclaimer: This transmission is intended solely for the addressee and may contain confidential information. If you are not the intended recipient, please immediately notify the sender at finance@asssr.org and delete this message. Unauthorized disclosure, dissemination, or copying of this communication is strictly prohibited.
====================================================`;
}

function getHtmlBody(doc, subject, stage = 1) {
  const name = `<i>${doc.name}</i>`;
  const paymentType = `<i>${doc.category}</i>`;
  const utrn = `<i>${doc.bankReferenceNo || doc.utr_rrn_reference_number || "Pending"}</i>`;
  const formLink = `https://finance.asssr.org/form/${doc.token}`;
  const underlinedLink = `<a href="${formLink}" style="text-decoration: underline; color: #1e40af;">${formLink}</a>`;
  
  let mainContentHtml = "";
  
  if (stage === 1) {
    mainContentHtml = `
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        We are pleased to inform you that the ${paymentType} portal is open via ARMS for submission of bank account details for processing of your payment.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        Please use the secure link below to submit your details. This link is valid for <strong>45 days</strong> only. Upon submission, a Unique Transfer Reference Number (UTRN) will be generated for your tracking.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        Link: ${underlinedLink}
      </p>
      <div style="margin-top: 24px; margin-bottom: 24px;">
        <h4 style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #111827;">Important Points:</h4>
        <ul style="font-size: 13px; color: #4b5563; padding-left: 20px; line-height: 1.5; margin-top: 0;">
          <li style="margin-bottom: 6px;">Please ensure the accuracy of the bank details provided.</li>
          <li style="margin-bottom: 6px;">The Office of Finance holds no liability for payments credited to incorrect accounts due to user-provided errors.</li>
          <li style="margin-bottom: 6px;">The submission link is valid for <strong>45 days</strong> only. After this period, the link will expire and no further claims will be entertained.</li>
        </ul>
      </div>
    `;
  } else if (stage === 2) {
    mainContentHtml = `
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        This is to confirm that your bank details for ${paymentType} have been successfully submitted via the AFMS portal.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        Your Unique Transfer Reference Number (UTRN) for tracking this transaction is: <strong>${utrn}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        You can track the status of your payment using the following link: ${underlinedLink}
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        Please note that the remittance process typically takes 45-60 working days (excluding weekends and holidays).
      </p>
    `;
  } else if (stage === 3) {
    const ifsc = `<i>${doc.ifsc_code || "N/A"}</i>`;
    const beneficiary = `<i>${doc.beneficiary_name || doc.name}</i>`;
    const account = `<i>${doc.account_number || "N/A"}</i>`;
    const refNo = `<i>${doc.receiptNumber || utrn}</i>`;
    const paymentDate = `<i>${doc.dateOfTransfer ? new Date(doc.dateOfTransfer).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</i>`;
    const amount = `<i>${Number(doc.amountAfterTds || doc.amount).toFixed(2)}</i>`;

    mainContentHtml = `
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        We are pleased to inform you that the payment against ${paymentType} under UTRN ${utrn} has been successfully released via AFMS from State Bank of India, Saket Branch, New Delhi-17, Branch Code 08442.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        The transaction details are as follows:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left; font-weight: bold;">
            <th style="padding: 10px; border: 1px solid #e5e7eb;">IFSC Code</th>
            <th style="padding: 10px; border: 1px solid #e5e7eb;">Beneficiary Details</th>
            <th style="padding: 10px; border: 1px solid #e5e7eb;">Bank Account No.</th>
            <th style="padding: 10px; border: 1px solid #e5e7eb;">Ref. No. & Date</th>
            <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${ifsc}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${beneficiary}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${account}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${refNo} & ${paymentDate}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">₹${amount}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        With this, the matter is settled and closed.
      </p>
    `;
  } else if (stage === 4) {
    const rejectionReason = doc.rejectionReason || "No reason provided";
    mainContentHtml = `
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        We regret to inform you that your ${paymentType} payment request has been rejected.
      </p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #dc2626; margin: 0 0 6px 0;">Reason for Rejection</p>
        <p style="font-size: 14px; color: #7f1d1d; margin: 0; font-style: italic;">${rejectionReason}</p>
      </div>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #374151;">
        If you believe this is an error or require further clarification, please contact the accounts section at <a href="mailto:finance@asssr.org" style="color: #1e40af;">finance@asssr.org</a>.
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #6b7280;">
        Note: Please do not use the previous submission link as it is no longer valid.
      </p>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 20px; color: #333333;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <img src="https://finance.asssr.org/header.png" alt="Asiatic Society for Social Science Research Logo" style="max-height: 80px; max-width: 100%; height: auto;" />
    </div>
    <div style="padding: 15px 24px 0 24px; font-size: 11px; color: #b91c1c; font-family: monospace;">
      [Please do not reply to this mail as this is an automated mail service.]
    </div>
    <div style="padding: 20px 24px;">
      <div style="font-size: 15px; font-weight: bold; margin-bottom: 16px; color: #000000;">
        ${subject}
      </div>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 4px; color: #374151;">Dear ${name},</p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px; color: #374151;">Greetings from Finance!</p>
      
      ${mainContentHtml}
      
      <div style="margin-top: 24px; font-size: 14px; line-height: 1.6; color: #374151;">
        With kind regards,<br/>
        <strong>O/o Finance</strong><br/>
        On behalf of Asiatic Society for Social Science Research and its Components
      </div>
      
      <p style="font-size: 11px; color: #16a34a; font-weight: bold; margin-top: 24px;">
        Print this mail only if absolutely necessary. Save Paper!! Save Trees!!
      </p>
    </div>
    <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb;">
      <div style="font-family: monospace; color: #9ca3af; text-align: center; margin-bottom: 10px;">
        ====================================================
      </div>
      <p style="font-size: 11px; line-height: 1.5; color: #6b7280; font-style: italic; margin: 0; text-align: justify;">
        Disclaimer: This transmission is intended solely for the addressee and may contain confidential information. If you are not the intended recipient, please immediately notify the sender at finance@asssr.org and delete this message. Unauthorized disclosure, dissemination, or copying of this communication is strictly prohibited.
      </p>
      <div style="font-family: monospace; color: #9ca3af; text-align: center; margin-top: 10px;">
        ====================================================
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendEmail(doc, stage = 1) {
  const fromEmail = process.env.SMTP_FROM || "noreply@finance.asssr.org";
  const from = `${doc.services} Finance <${fromEmail}>`;
  const subject = getSubject(doc, stage);
  const htmlSubject = getHtmlSubject(doc, stage);
  const text = getBody(doc, stage);
  const html = getHtmlBody(doc, htmlSubject, stage);

  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;

  if (!apiKey) {
    console.log("----------------------------------------");
    console.log(`[DEV MODE] No API key found. Simulating Email for STAGE ${stage}.`);
    console.log(`To: ${doc.email} | Subject: ${subject}`);
    console.log("----------------------------------------");
    return Promise.resolve("Simulated email delivery successfully");
  }

  // Use Resend HTTP API (port 443 — works on all VPS without SMTP port restrictions)
  // Logo is served from a hosted URL to avoid base64 bloat that causes Gmail clipping (102KB limit)
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [doc.email],
      subject,
      text,
      html,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Resend API error: ${response.status}`);
  }

  return { messageId: result.id };
}

module.exports = { sendEmail };
