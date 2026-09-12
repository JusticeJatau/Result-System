import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { ClassRoom } from "../models/Academic.js";

const router = express.Router();
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase(), active: true }).select("+password").populate("school");
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ message: "Invalid email or password" });
  if (!user.school || user.school.status === "suspended") return res.status(403).json({ message: "This school account is currently suspended" });
  if (user.school.status === "archived") return res.status(403).json({ message: "This school account is no longer active" });
  // Form Master is a class responsibility, not an account role. Upgrade old accounts safely.
  if (user.role === "form_master") {
    user.role = "teacher";
    await user.save();
  }
  const formMasterClasses = user.role === "admin" ? [] : await ClassRoom.distinct("name", { school: user.school._id, formMaster: user._id, active: true });
  const token = jwt.sign({ id: user.id, school: user.school._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isFormMaster: formMasterClasses.length > 0, formMasterClasses, school: user.school } });
});
router.put("/password", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!user || !(await bcrypt.compare(req.body.currentPassword || "", user.password))) return res.status(400).json({ message: "Current password is incorrect" });
  if (!req.body.newPassword || req.body.newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.json({ message: "Password changed successfully" });
});
export default router;
