require("dotenv").config();
const connectDB = require("./config/db");
const Record = require("./models/Record");

async function check() {
  await connectDB();
  const records = await Record.find().sort({ createdAt: -1 });
  console.log(`Total records in DB: ${records.length}`);
  for (const r of records) {
    console.log(`- ID: ${r._id} | Name: ${r.name} | Component: ${r.services} | Email Sent: ${r.emailSent} | Error: ${r.error} | Created At: ${r.createdAt}`);
  }
  process.exit(0);
}

check();
