const fs = require("fs");

const path = "/home/ubuntu/fms-new/fmsDashboard/backend/routes/records.js";
let content = fs.readFileSync(path, "utf8");

// Fix generateUtrn()
content = content.replace(
`  const comp = (component || "ASSSR").toUpperCase();
  const shortPrefix = comp.substring(0, 3);
  const year = new Date().getFullYear();`,
`  const comp = (component || "ASSSR").toUpperCase();

  const shortPrefix = {
    ASSSR: "ASR",
    VMI: "VMI",
    DHC: "DHC",
    JASSSR: "JAS",
  }[comp] || comp.substring(0, 3);

  const year = new Date().getFullYear();`
);

// Fix receipt prefix during payment processing
content = content.replace(
`const prefix = { ASSSR: "A", VMI: "V", DHC: "D", JASSSR: "J" }[record.services] || "X";`,
`const prefix = { ASSSR: "ASR", VMI: "VMI", DHC: "DHC", JASSSR: "JAS" }[record.services] || "X";`
);

fs.writeFileSync(path, content, "utf8");

console.log("✅ records.js updated successfully.");
