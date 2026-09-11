import express from "express";
import bcrypt from "bcryptjs";
import { protect, allow } from "../middleware/auth.js";
import { Student, Subject, Assignment } from "../models/Academic.js";
import User from "../models/User.js";
import Score from "../models/Score.js";
import School from "../models/School.js";

const router = express.Router();
router.use(protect);
const modelRoutes = [{ path: "students", Model: Student }, { path: "subjects", Model: Subject }];
for (const { path, Model } of modelRoutes) {
  router.get(`/${path}`, async (req, res) => res.json(await Model.find({ school: req.user.school, active: { $ne: false } }).sort({ createdAt: -1 })));
  router.post(`/${path}`, allow("admin"), async (req, res) => res.status(201).json(await Model.create({ ...req.body, school: req.user.school })));
  router.put(`/${path}/:id`, allow("admin"), async (req, res) => res.json(await Model.findOneAndUpdate({ _id: req.params.id, school: req.user.school }, req.body, { new: true })));
}
router.get("/teachers", allow("admin"), async (req, res) => res.json(await User.find({ school: req.user.school }).select("-password")));
router.post("/teachers", allow("admin"), async (req, res) => res.status(201).json(await User.create({ ...req.body, school: req.user.school, password: await bcrypt.hash(req.body.password, 10) })));
router.get("/assignments", async (req, res) => res.json(await Assignment.find({ school: req.user.school }).populate("teacher subject")));
router.post("/assignments", allow("admin"), async (req, res) => res.status(201).json(await Assignment.create({ ...req.body, school: req.user.school })));
router.get("/dashboard", async (req, res) => {
  const [students, teachers, subjects, pending] = await Promise.all([
    Student.countDocuments({ school: req.user.school, active: true }), User.countDocuments({ school: req.user.school, active: true }),
    Subject.countDocuments({ school: req.user.school }), Score.countDocuments({ school: req.user.school, status: { $ne: "finalized" } })
  ]);
  res.json({ students, teachers, subjects, pending });
});
router.put("/settings", allow("admin"), async (req, res) => res.json(await School.findByIdAndUpdate(req.user.school, req.body, { new: true })));
export default router;
