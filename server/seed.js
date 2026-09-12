import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import School from "./models/School.js";
import User from "./models/User.js";
import { Student, Subject, Assignment, ClassRoom, AcademicPeriod } from "./models/Academic.js";
import Score from "./models/Score.js";
import AuditLog from "./models/AuditLog.js";

await connectDB();
await Promise.all([School.deleteMany({}), User.deleteMany({}), Student.deleteMany({}), Subject.deleteMany({}), Assignment.deleteMany({}), ClassRoom.deleteMany({}), AcademicPeriod.deleteMany({}), Score.deleteMany({}), AuditLog.deleteMany({})]);
const school = await School.create({ name: "Shammer Ambassadors Academy", code: "SAA", address: "Damaturu, Yobe State", motto: "Raising Future Ambassadors", logoUrl: "/school-logo.png", activeSession: "2026/2027", activeTerm: "First Term" });
const [admin, teacher, formMaster] = await User.create([
  { school: school._id, name: "Amina Yusuf", email: "admin@brightfuture.edu", password: await bcrypt.hash("password123", 10), role: "admin" },
  { school: school._id, name: "Musa Ibrahim", email: "teacher@brightfuture.edu", password: await bcrypt.hash("password123", 10), role: "teacher" },
  { school: school._id, name: "Grace David", email: "formmaster@brightfuture.edu", password: await bcrypt.hash("password123", 10), role: "form_master" }
]);
await Student.insertMany([
  { school: school._id, admissionNo: "SAA/001", fullName: "Ibrahim Yusuf", gender: "Male", className: "JSS 1A", session: "2026/2027" },
  { school: school._id, admissionNo: "SAA/002", fullName: "Aisha Bello", gender: "Female", className: "JSS 1A", session: "2026/2027" },
  { school: school._id, admissionNo: "SAA/003", fullName: "David Musa", gender: "Male", className: "JSS 1A", session: "2026/2027" }
]);
const [maths, english, science] = await Subject.insertMany([{ school: school._id, name: "Mathematics", code: "MTH", classes: ["JSS 1A"] }, { school: school._id, name: "English Language", code: "ENG", classes: ["JSS 1A"] }, { school: school._id, name: "Basic Science", code: "BSC", classes: ["JSS 1A"] }]);
await ClassRoom.create({ school: school._id, name: "JSS 1A", level: "JSS 1", arm: "A", session: "2026/2027", formMaster: formMaster._id });
await AcademicPeriod.create({ school: school._id, session: "2026/2027", term: "First Term", scoreEntryOpen: true, active: true });
await Assignment.insertMany([
  { school: school._id, teacher: teacher._id, className: "JSS 1A", subject: maths._id },
  { school: school._id, teacher: formMaster._id, className: "JSS 1A", subject: english._id, isFormMaster: true },
  { school: school._id, teacher: teacher._id, className: "JSS 1A", subject: science._id }
]);
console.log("Seed complete. Password for all accounts: password123"); console.log("Admin: admin@brightfuture.edu"); console.log("Teacher: teacher@brightfuture.edu"); console.log("Form Master: formmaster@brightfuture.edu"); process.exit();
