const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `      } else if (selectedFormType === 'tada') {
        dataToSave.form_type = 'tada';
        dataToSave.category = 'TA/DA';
        // Journey tables
        dataToSave.journeyRows = journeyRows;
        dataToSave.localJourneyRows = localJourneyRows;
        // Calculation
        const journeySum = journeyRows.reduce((acc, row) => acc + Number(row.journey_amount || 0), 0);
        const localSum = localJourneyRows.reduce((acc, row) => acc + Number(row.local_journey_amount || 0), 0);
        dataToSave.grand_total = journeySum + localSum;
        dataToSave.amount = Number(formData.passed_for_payment_amount || dataToSave.grand_total);
        dataToSave.claimant_signature = formData.claimant_signature;`;

const newStr = `      } else if (selectedFormType === 'tada') {
        if (!formData.nature_of_programme && !formData.programme_nature) {
          setError('Nature of Programme is required.');
          setSaving(false);
          return;
        }
        if (!formData.title_of_programme && !formData.programme_title) {
          setError('Title of Programme is required.');
          setSaving(false);
          return;
        }
        dataToSave.form_type = 'tada';
        dataToSave.category = 'TA/DA';
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.nature_of_programme = dataToSave.programme_nature;
        dataToSave.title_of_programme = dataToSave.programme_title;
        // Journey tables
        dataToSave.journeyRows = journeyRows;
        dataToSave.localJourneyRows = localJourneyRows;
        // Calculation
        const journeySum = journeyRows.reduce((acc, row) => acc + Number(row.journey_amount || 0), 0);
        const localSum = localJourneyRows.reduce((acc, row) => acc + Number(row.local_journey_amount || 0), 0);
        dataToSave.grand_total = journeySum + localSum;
        dataToSave.amount = Number(formData.passed_for_payment_amount || dataToSave.grand_total);
        dataToSave.claimant_signature = formData.claimant_signature;`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
