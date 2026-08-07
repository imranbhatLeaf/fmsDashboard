const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `      // Nature of Programme & Title (min 4 chars) — for all non-refund forms
      if (selectedFormType !== 'refund') {
        const natureVal = (dataToSave.nature_of_programme || dataToSave.programme_nature || "").trim();
        if (natureVal && natureVal.length < 4) {
          setError("Nature of Programme must be at least 4 characters.");
          setSaving(false);
          return;
        }
        const titleVal = (dataToSave.title_of_programme || dataToSave.programme_title || "").trim();
        if (titleVal && titleVal.length < 4) {
          setError("Title of Programme must be at least 4 characters.");
          setSaving(false);
          return;
        }
      }`;

const newStr = `      // Nature of Programme & Title — required and min 4 chars for all non-refund forms
      if (selectedFormType !== 'refund') {
        const natureVal = (dataToSave.nature_of_programme || dataToSave.programme_nature || "").trim();
        if (!natureVal || natureVal.length === 0) {
          setError("Nature of Programme is required.");
          setSaving(false);
          return;
        }
        if (natureVal.length < 4) {
          setError("Nature of Programme must be at least 4 characters.");
          setSaving(false);
          return;
        }
        const titleVal = (dataToSave.title_of_programme || dataToSave.programme_title || "").trim();
        if (!titleVal || titleVal.length === 0) {
          setError("Title of Programme is required.");
          setSaving(false);
          return;
        }
        if (titleVal.length < 4) {
          setError("Title of Programme must be at least 4 characters.");
          setSaving(false);
          return;
        }
      }`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
