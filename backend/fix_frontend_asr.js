const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";

let content = fs.readFileSync(path, "utf8");

// Replace substring logic
content = content.replace(
`const shortPrefix = comp.substring(0, 3);`,
`const shortPrefix = {
  ASSSR: "ASR",
  VMI: "VMI",
  DHC: "DHC",
  JASSSR: "JAS",
}[comp] || comp.substring(0, 3);`
);

// Replace hardcoded ASS prefix if present
content = content.replace(/ASS2026/g, "ASR2026");
content = content.replace(/ASS/g, "ASR");

fs.writeFileSync(path, content, "utf8");
console.log("✅ Frontend updated.");
