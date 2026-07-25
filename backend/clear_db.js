require("dotenv").config();
const connectDB = require("./config/db");
const Record = require("./models/Record");

async function clear() {
  await connectDB();
  await Record.deleteMany({});
  console.log("DB Cleared");
  process.exit(0);
}
clear();
