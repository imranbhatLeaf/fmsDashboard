const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/backend/routes/records.js";
let content = fs.readFileSync(path, "utf8");

const oldStr = `      data.localJourneyMode = data.local_journey_mode;
      data.localJourneyAmount = data.local_journey_amount;
      data.grandTotal = data.grand_total;
    }
    // ASSSR Honorarium Form normalization & compatibility mapping`;

const newStr = `      data.localJourneyMode = data.local_journey_mode;
      data.localJourneyAmount = data.local_journey_amount;
      data.grandTotal = data.grand_total;
      if (data.nature_of_programme) data.programme_nature = data.nature_of_programme;
      if (data.title_of_programme) data.programme_title = data.title_of_programme;
      if (data.programme_nature) data.programmeNature = data.programme_nature;
      if (data.programme_title) data.programmeTitle = data.programme_title;
    }
    // ASSSR Honorarium Form normalization & compatibility mapping`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileFS(path, content, "utf8");
console.log("Done.");
