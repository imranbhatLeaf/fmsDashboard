require("dotenv").config();
const connectDB = require("./config/db");
const Record = require("./models/Record");
const readline = require("readline");

// ─── Configure which records to delete ───────────────────────────────────────
// Records matching ANY of these conditions will be deleted.
// Edit these to match your dummy/test data.
const TEST_EMAIL_DOMAINS = ["example.com"];
const TEST_EMAILS = [
  "thegamerotakuyt@gmail.com",
  "imranbhat9444@gmail.com",
  "johndoe@example.com",
  "janesmith@example.com",
  "alicej@example.com",
];
const TEST_NAMES = [
  "John Doe", "Jane Smith", "Alice Johnson", "Bob Brown",
  "Charlie Davis", "Diana Evans", "Ethan Foster", "Fiona Green",
  "George Harris", "Hannah Adams",
];
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await connectDB();

  const query = {
    $or: [
      { email: { $in: TEST_EMAILS } },
      { email: { $regex: TEST_EMAIL_DOMAINS.join("|"), $options: "i" } },
      { name: { $in: TEST_NAMES } },
    ],
  };

  const records = await Record.find(query).sort({ createdAt: -1 });

  if (records.length === 0) {
    console.log("✅ No test/dummy records found. Nothing to delete.");
    process.exit(0);
  }

  console.log(`\n⚠️  Found ${records.length} test/dummy record(s) to delete:\n`);
  records.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} | ${r.email} | ${r.services} | ${r.category} | Created: ${r.createdAt.toLocaleDateString("en-IN")}`);
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(`\n❓ Permanently delete all ${records.length} record(s)? Type YES to confirm: `, async (answer) => {
    rl.close();
    if (answer.trim() === "YES") {
      const ids = records.map((r) => r._id);
      const result = await Record.deleteMany({ _id: { $in: ids } });
      console.log(`\n✅ Deleted ${result.deletedCount} record(s) successfully.`);
    } else {
      console.log("\n❌ Aborted. No records were deleted.");
    }
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
