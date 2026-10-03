const mongoose = require("mongoose");
const User = require("./models/User");

const MONGO_URI = "mongodb://localhost:27017/fms";

async function resetUsers() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Delete and recreate both users fresh
  await User.deleteMany({ username: { $in: ["admin", "registrar"] } });
  console.log("Deleted old users");

  await User.create({ username: "admin", password: "admin@fms2026", role: "admin" });
  await User.create({ username: "registrar", password: "registrar@fms2026", role: "registrar" });
  console.log("Users recreated successfully:");
  console.log("  admin     / admin@fms2026");
  console.log("  registrar / registrar@fms2026");

  await mongoose.disconnect();
  process.exit(0);
}

resetUsers().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
