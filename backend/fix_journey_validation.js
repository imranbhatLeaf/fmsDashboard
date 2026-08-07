const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `      // Final required field check before save
      if (selectedFormType !== 'refund') {`;

const newStr = `      // Journey fields validation for TA/DA
      if (selectedFormType === 'tada') {
        const LOCATION_REGEX = /[A-Za-z]/;
        for (let i = 0; i < journeyRows.length; i++) {
          const row = journeyRows[i];
          if (!row.journey_from || !row.journey_from.trim()) {
            setError(\`Journey row \${i + 1}: "From" is required.\`);
            setSaving(false);
            return;
          }
          if (!LOCATION_REGEX.test(row.journey_from)) {
            setError(\`Journey row \${i + 1}: "From" must contain letters, not just numbers.\`);
            setSaving(false);
            return;
          }
          if (!row.journey_to || !row.journey_to.trim()) {
            setError(\`Journey row \${i + 1}: "To" is required.\`);
            setSaving(false);
            return;
          }
          if (!LOCATION_REGEX.test(row.journey_to)) {
            setError(\`Journey row \${i + 1}: "To" must contain letters, not just numbers.\`);
            setSaving(false);
            return;
          }
          if (!row.journey_amount || Number(row.journey_amount) <= 0) {
            setError(\`Journey row \${i + 1}: Amount is required and must be greater than 0.\`);
            setSaving(false);
            return;
          }
        }
        for (let i = 0; i < localJourneyRows.length; i++) {
          const row = localJourneyRows[i];
          const hasAnyLocal = row.local_journey_from || row.local_journey_to || row.local_journey_amount;
          if (hasAnyLocal) {
            if (!row.local_journey_from || !row.local_journey_from.trim()) {
              setError(\`Local journey row \${i + 1}: "From" is required.\`);
              setSaving(false);
              return;
            }
            if (!LOCATION_REGEX.test(row.local_journey_from)) {
              setError(\`Local journey row \${i + 1}: "From" must contain letters, not just numbers.\`);
              setSaving(false);
              return;
            }
            if (!row.local_journey_to || !row.local_journey_to.trim()) {
              setError(\`Local journey row \${i + 1}: "To" is required.\`);
              setSaving(false);
              return;
            }
            if (!LOCATION_REGEX.test(row.local_journey_to)) {
              setError(\`Local journey row \${i + 1}: "To" must contain letters, not just numbers.\`);
              setSaving(false);
              return;
            }
            if (!row.local_journey_amount || Number(row.local_journey_amount) <= 0) {
              setError(\`Local journey row \${i + 1}: Amount is required and must be greater than 0.\`);
              setSaving(false);
              return;
            }
          }
        }
      }

      // Final required field check before save
      if (selectedFormType !== 'refund') {`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
