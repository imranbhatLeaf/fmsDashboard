const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/PreviewModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `                </div>
                </div>
                {record.remarks && <div className="text-xs text-gray-500 pt-1"><strong>Remarks:</strong> {record.remarks}</div>}`;

const newStr = `                </div>
                {record.remarks && <div className="text-xs text-gray-500 pt-1"><strong>Remarks:</strong> {record.remarks}</div>}`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
