require("dotenv").config();
const connectDB = require("./config/db");
const Record = require("./models/Record");

async function check() {
  await connectDB();
  console.log("Searching for Faisal Bhat or Prof. S. Iyer...");
  const records = await Record.find({ name: { $regex: /Faisal|Iyer|Ravi|Doe|Smith|Johnson/i } }).sort({ createdAt: -1 });
  console.log(`Found ${records.length} records matching the search.`);
  for (const r of records) {
    console.log(`- Name: ${r.name}`);
    console.log(`  Email: ${r.email}`);
    console.log(`  Component: ${r.services}`);
    console.log(`  Category: ${r.category}`);
    console.log(`  Email Sent: ${r.emailSent}`);
    console.log(`  Error: ${r.error}`);
    console.log(`  Created At: ${r.createdAt}`);
    console.log("------------------------");
  }
  process.exit(0);
}

check();
