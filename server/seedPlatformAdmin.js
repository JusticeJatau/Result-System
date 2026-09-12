import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import PlatformAdmin from "./models/PlatformAdmin.js";

async function run() {
  await connectDB();
  const username = String(process.env.PLATFORM_ADMIN_USERNAME || "echo8v").toLowerCase().trim();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error("Set PLATFORM_ADMIN_PASSWORD in server/.env with at least 12 characters");
  await PlatformAdmin.findOneAndUpdate(
    { username },
    { $set: { name: process.env.PLATFORM_ADMIN_NAME || "Echo8V", active: true, password: await bcrypt.hash(password, 12) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Platform Admin created: ${username}`);
  process.exit(0);
}

run().catch(error => { console.error("Platform Admin seed failed:", error.message); process.exit(1); });
