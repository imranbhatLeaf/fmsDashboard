const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/backend/routes/records.js";
let content = fs.readFileSync(path, "utf8");

const oldStr = `async function generateUtrn(component) {
  const comp = (component || "ASSSR").toUpperCase();
  const shortPrefix = {
    ASSSR: "ASR",
    VMI: "VMI",
    DHC: "DHC",
    JASSSR: "JAS",
  }[comp] || comp.substring(0, 3);
  const year = new Date().getFullYear();
  const prefix = \`\${shortPrefix}\${year}\`;
  const count = await Record.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  const seq = String(count + 1).padStart(3, "0");
  return \`\${prefix}\${seq}\`;
}`;

const newStr = `async function generateUtrn(component) {
  const comp = (component || "ASSSR").toUpperCase();
  const shortPrefix = {
    ASSSR: "ASR",
    VMI: "VMI",
    DHC: "DHC",
    JASSSR: "JAS",
  }[comp] || comp.substring(0, 3);
  const year = new Date().getFullYear();
  const prefix = \`\${shortPrefix}\${year}\`;
  let utrn;
  let attempts = 0;
  while (attempts < 10) {
    const count = await Record.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    const seq = String(count + 1 + attempts).padStart(3, "0");
    utrn = \`\${prefix}\${seq}\`;
    const exists = await Record.findOne({ token: utrn });
    if (!exists) break;
    attempts++;
  }
  return utrn;
}`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
