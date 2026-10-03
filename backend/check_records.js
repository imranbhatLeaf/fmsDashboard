require("dotenv").config();
const mongoose = require("mongoose");
const Record = require("./models/Record");

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fms")
  .then(async () => {
    try {
      const records = await Record.find({}).sort({ createdAt: -1 }).limit(5);
      console.log(`Found ${records.length} recent records:`);
      records.forEach(r => {
        console.log(`--------------------------------------------------`);
        console.log(`Name: ${r.name}`);
        console.log(`Token: ${r.token}`);
        console.log(`Payee Link Token: ${r.payee_link_token}`);
        console.log(`Status: ${r.payee_status}`);
        console.log(`Form Submitted: ${r.formSubmitted}`);
        console.log(`Created At: ${r.createdAt}`);
        console.log(`Expires At: ${r.expiresAt}`);
      });
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  });
