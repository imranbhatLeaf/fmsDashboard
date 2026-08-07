const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.nature_of_programme = dataToSave.programme_nature;
        dataToSave.title_of_programme = dataToSave.programme_title;`;

const newStr = `        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.nature_of_programme = dataToSave.programme_nature;
        dataToSave.title_of_programme = dataToSave.programme_title;
        dataToSave.programmeNature = dataToSave.programme_nature;
        dataToSave.programmeTitle = dataToSave.programme_title;`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");
