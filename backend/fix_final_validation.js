const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `      await onSave(dataToSave);
    } catch (err) {
      setError(err.message || "Failed to save record.");`;

const newStr = `      // Final required field check before save
      if (selectedFormType !== 'refund') {
        const finalNature = (dataToSave.nature_of_programme || dataToSave.programme_nature || "").trim();
        if (!finalNature || finalNature.length < 4) {
          setError("Nature of Programme is required and must be at least 4 characters.");
          setSaving(false);
          return;
        }
        const finalTitle = (dataToSave.title_of_programme || dataToSave.programme_title || "").trim();
        if (!finalTitle || finalTitle.length < 4) {
          setError("Title of Programme is required and must be at least 4 characters.");
          setSaving(false);
          return;
        }
        const finalDesig = (dataToSave.designation || "").trim();
        if (!finalDesig || finalDesig.length < 2) {
          setError("Designation is required.");
          setSaving(false);
          return;
        }
        const finalAddress = (dataToSave.address || "").trim();
        if (!finalAddress || finalAddress.length < 4) {
          setError("Address is required.");
          setSaving(false);
          return;
        }
      }
      await onSave(dataToSave);
    } catch (err) {
      setError(err.message || "Failed to save record.");`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
