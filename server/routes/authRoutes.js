import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase(), active: true }).select("+password").populate("school");
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ message: "Invalid email or password" });
  const token = jwt.sign({ id: user.id, school: user.school._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school } });
});
export default router;
