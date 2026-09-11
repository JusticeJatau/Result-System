import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import School from "./models/School.js";
import User from "./models/User.js";
import { Student, Subject } from "./models/Academic.js";

await connectDB();
await Promise.all([School.deleteMany({}), User.deleteMany({}), Student.deleteMany({}), Subject.deleteMany({})]);
const school = await School.create({ name: "Bright Future Academy", code: "BFA", address: "Damaturu, Yobe State", activeSession: "2026/2027", activeTerm: "First Term" });
await User.create({ school: school._id, name: "Amina Yusuf", email: "admin@brightfuture.edu", password: await bcrypt.hash("password123", 10), role: "admin" });
await Student.insertMany([
  { school: school._id, admissionNo: "BFA/001", fullName: "Ibrahim Yusuf", gender: "Male", className: "JSS 1A", session: "2026/2027" },
  { school: school._id, admissionNo: "BFA/002", fullName: "Aisha Bello", gender: "Female", className: "JSS 1A", session: "2026/2027" },
  { school: school._id, admissionNo: "BFA/003", fullName: "David Musa", gender: "Male", className: "JSS 1A", session: "2026/2027" }
]);
await Subject.insertMany([{ school: school._id, name: "Mathematics", code: "MTH", classes: ["JSS 1A"] }, { school: school._id, name: "English Language", code: "ENG", classes: ["JSS 1A"] }, { school: school._id, name: "Basic Science", code: "BSC", classes: ["JSS 1A"] }]);
console.log("Seed complete: admin@brightfuture.edu / password123"); process.exit();
