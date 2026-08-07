const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx";
let content = fs.readFileSync(path, "utf8");

// 1. TA/DA (line ~371)
content = content.replace(
  `        // Auto-fill core fields for compatibility
        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.total_amount = Number(formData.total || 0);
        dataToSave.amount = Number(formData.passed_for_payment_amount || formData.total || formData.amount || 0);`,
  `        // Auto-fill core fields for compatibility
        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.pay_level = formData.pay_level;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.total_amount = Number(formData.total || 0);
        dataToSave.amount = Number(formData.passed_for_payment_amount || formData.total || formData.amount || 0);`
);

// 2. Honorarium (line ~434)
content = content.replace(
  `        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.participation_type = formData.nature_of_participation || formData.participation_type;`,
  `        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.pay_level = formData.pay_level;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.participation_type = formData.nature_of_participation || formData.participation_type;`
);

const count = (content.match(/dataToSave\.pay_level/g) || []).length;
fs.writeFileSync(path, content, "utf8");
console.log(`Done. pay_level assigned in ${count} places.`);
