const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

// Check current state
const validationExists = content.includes('Pay Level is required');
const salaryHasPayLevel = content.includes("dataToSave.category = 'Salary';\n        dataToSave.name = formData.name;\n        dataToSave.email = formData.email;\n        dataToSave.designation = formData.designation;\n        dataToSave.pay_level");

console.log("Validation block exists:", validationExists);
console.log("Salary has pay_level in dataToSave:", salaryHasPayLevel);
console.log("pay_level in dataToSave count:", (content.match(/dataToSave\.pay_level/g) || []).length);

// Show lines around save button click
const lines = content.split('\n');
const saveIdx = lines.findIndex(l => l.includes('setSaving(true)') || l.includes('handleSave') || l.includes('async function save'));
console.log("Save function around line:", saveIdx);
console.log(lines.slice(saveIdx, saveIdx + 5).join('\n'));
