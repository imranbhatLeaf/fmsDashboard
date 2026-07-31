require("dotenv").config();
const connectDB = require("./config/db");
const Record = require("./models/Record");

async function check() {
  await connectDB();
  console.log("Fetching last 5 records...");
  const records = await Record.find().sort({ createdAt: -1 }).limit(5);
  for (const r of records) {
    console.log(`- ID: ${r._id}`);
    console.log(`  Name: ${r.name}`);
    console.log(`  Email: ${r.email}`);
    console.log(`  Component: ${r.services}`);
    console.log(`  Token: ${r.token}`);
    console.log(`  Email Sent: ${r.emailSent}`);
    console.log(`  Error: ${r.error}`);
    console.log(`  Date of Upload: ${r.dateOfUpload}`);
    console.log(`  Created At: ${r.createdAt}`);
    console.log("------------------------");
  }
  process.exit(0);
}

check();
