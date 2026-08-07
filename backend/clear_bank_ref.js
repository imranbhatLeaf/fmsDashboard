require("dotenv").config();
const connectDB = require("./config/db");
const Record = require("./models/Record");

async function run() {
  await connectDB();
  const result = await Record.updateMany(
    { bankReferenceNo: { $exists: true, $ne: null } },
    { $set: { bankReferenceNo: null } }
  );
  console.log(`Cleared bankReferenceNo on ${result.modifiedCount} record(s).`);
  process.exit(0);
}
run();
