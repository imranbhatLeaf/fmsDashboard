const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/PreviewModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(record.grandTotal || record.grand_total || record.amount || 0).toLocaleString("en-IN")}</span>
                  </div>`;

const newStr = `                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(row.journey_amount || 0).toLocaleString("en-IN")}</span></div>
                  </div>`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
