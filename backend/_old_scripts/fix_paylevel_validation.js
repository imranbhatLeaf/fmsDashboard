const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `      // Name & Designation: letters, spaces, dots, hyphens only (no numbers or special chars)
      const NAME_REGEX = /^[A-Za-z .\\-']+$/;`;

const newStr = `      // Pay Level validation for Honorarium, TA/DA, Salary
      if (["honorarium", "tada", "salary"].includes(selectedFormType)) {
        if (!formData.pay_level || formData.pay_level.trim() === "") {
          setError("Pay Level is required. Please select a pay level.");
          setSaving(false);
          return;
        }
      }

      // Name & Designation: letters, spaces, dots, hyphens only (no numbers or special chars)
      const NAME_REGEX = /^[A-Za-z .\\-']+$/;`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
