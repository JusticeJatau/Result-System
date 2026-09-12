import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import PlatformAdmin from "../models/PlatformAdmin.js";
import School from "../models/School.js";
import User from "../models/User.js";
import { Student } from "../models/Academic.js";
import { protectPlatform } from "../middleware/platformAuth.js";

const router = express.Router();

router.post("/auth/login", async (req, res) => {
  const username = String(req.body.username || "").toLowerCase().trim();
  const admin = await PlatformAdmin.findOne({ username, active: true }).select("+password");
  if (!admin || !(await bcrypt.compare(req.body.password || "", admin.password))) return res.status(401).json({ message: "Invalid platform credentials" });
  admin.lastLoginAt = new Date();
  await admin.save();
  const token = jwt.sign({ id: admin.id, name: admin.name, username: admin.username, type: "platform_admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, admin: { id: admin.id, name: admin.name, username: admin.username } });
});

router.use(protectPlatform);

router.get("/dashboard", async (_req, res) => {
  const [schools, activeSchools, suspendedSchools, students] = await Promise.all([
    School.countDocuments({ status: { $ne: "archived" } }), School.countDocuments({ status: "active" }),
    School.countDocuments({ status: "suspended" }), Student.countDocuments({ active: true })
  ]);
  res.json({ schools, activeSchools, suspendedSchools, students });
});

router.get("/schools", async (_req, res) => {
  const schools = await School.find({ status: { $ne: "archived" } }).sort({ createdAt: -1 }).lean();
  const rows = await Promise.all(schools.map(async school => {
    const [admins, teachers, students] = await Promise.all([
      User.countDocuments({ school: school._id, role: "admin", active: true }),
      User.countDocuments({ school: school._id, role: { $in: ["teacher", "form_master"] }, active: true }),
      Student.countDocuments({ school: school._id, active: true })
    ]);
    return { ...school, status: school.status || "active", plan: school.plan || "starter", billingCycle: school.billingCycle || "monthly", price: school.price || 0, admins, teachers, students };
  }));
  res.json(rows);
});

router.post("/schools", async (req, res) => {
  const { name, code, address, motto, adminName, adminEmail, adminPassword, plan, billingCycle, price, activeSession, activeTerm } = req.body;
  if (!name || !code || !adminName || !adminEmail || !adminPassword) return res.status(400).json({ message: "School name, code and Admin account details are required" });
  if (String(adminPassword).length < 8) return res.status(400).json({ message: "School Admin password must be at least 8 characters" });
  let school;
  try {
    school = await School.create({ name, code: String(code).toUpperCase().trim(), address, motto, status: "active", plan: plan || "starter", billingCycle: billingCycle || "monthly", price: Number(price || 0), activeSession: activeSession || "2026/2027", activeTerm: activeTerm || "First Term" });
    const admin = await User.create({ school: school._id, name: adminName, email: String(adminEmail).toLowerCase().trim(), password: await bcrypt.hash(adminPassword, 10), role: "admin" });
    res.status(201).json({ school, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    if (school) await School.findByIdAndDelete(school._id);
    throw error;
  }
});

router.put("/schools/:id", async (req, res) => {
  const allowed = ["name", "code", "address", "motto", "plan", "billingCycle", "price", "currency", "subscriptionEndsAt", "activeSession", "activeTerm"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (updates.code) updates.code = String(updates.code).toUpperCase().trim();
  if (updates.price !== undefined) updates.price = Number(updates.price);
  const school = await School.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!school) return res.status(404).json({ message: "School not found" });
  res.json(school);
});

router.patch("/schools/:id/status", async (req, res) => {
  if (!["active", "suspended"].includes(req.body.status)) return res.status(400).json({ message: "Invalid school status" });
  const school = await School.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!school) return res.status(404).json({ message: "School not found" });
  res.json(school);
});

router.delete("/schools/:id", async (req, res) => {
  const school = await School.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
  if (!school) return res.status(404).json({ message: "School not found" });
  await User.updateMany({ school: school._id }, { active: false });
  res.json({ message: "School archived. Its academic records were preserved." });
});

export default router;
