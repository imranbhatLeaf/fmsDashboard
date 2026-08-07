const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/PreviewModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `                  <span className="font-mono">₹{(record.journeyRows || []).reduce((sum, row) => sum + Number(row.journey_amount || 0) + Number(row.local_journey_amount || 0), 0).toLocaleString("en-IN")}</span>`;

const newStr = `                  <span className="font-mono">₹{(() => { const j = (record.journeyRows || []).reduce((s, r) => s + Number(r.journey_amount || 0), 0); const l = (record.localJourneyRows || []).reduce((s, r) => s + Number(r.local_journey_amount || 0), 0); return (j + l).toLocaleString("en-IN"); })()}</span>`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
