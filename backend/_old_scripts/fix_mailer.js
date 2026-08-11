const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/backend/utils/mailer.js";

let content = fs.readFileSync(path, "utf8");

// 1. Add SERVICE_NAMES map and getOrgName after nodemailer require
content = content.replace(
  `const nodemailer = require("nodemailer");`,
  `const nodemailer = require("nodemailer");

const SERVICE_NAMES = {
  ASSSR: "Asiatic Society for Social Science Research",
  VMI: "Varāhamihira Multidisciplinary Institute",
  DHC: "Deccan History Congress",
  JASSSR: "Journal of Asiatic Society for Social Science Research",
};

function getOrgName(doc) {
  return SERVICE_NAMES[doc.services] || SERVICE_NAMES[doc.component] || doc.services || "ASSSR";
}`
);

// 2. Plain text footer
content = content.replace(
  `On behalf of Asiatic Society for Social Science Research and its Components`,
  "On behalf of " + "${getOrgName(doc)}" + " and its Components"
);

// 3. HTML header h2
content = content.replace(
  `<h2 style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: bold;">Asiatic Society for Social Science Research</h2>`,
  `<h2 style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: bold;">\${getOrgName(doc)}</h2>`
);

// 4. HTML footer
content = content.replace(
  `        On behalf of Asiatic Society for Social Science Research and its Components`,
  "        On behalf of " + "${getOrgName(doc)}" + " and its Components"
);

fs.writeFileSync(path, content, "utf8");
console.log("Done. Verify with: grep -n 'getOrgName\\|Asiatic' " + path);
