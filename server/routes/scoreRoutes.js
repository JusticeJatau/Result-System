import express from "express";
import { protect, allow } from "../middleware/auth.js";
import Score from "../models/Score.js";
import School from "../models/School.js";

const router = express.Router();
router.use(protect);
router.get("/", async (req, res) => res.json(await Score.find({ school: req.user.school, ...req.query }).populate("student subject enteredBy", "fullName admissionNo name code")));
router.post("/save", async (req, res) => {
  const school = await School.findById(req.user.school);
  const maxByName = Object.fromEntries(school.assessment.map(item => [item.name, item.maxScore]));
  const operations = req.body.scores.map(item => {
    for (const [name, value] of Object.entries(item.components)) if (value < 0 || value > maxByName[name]) throw new Error(`${name} must be between 0 and ${maxByName[name]}`);
    const total = Object.values(item.components).reduce((sum, value) => sum + Number(value || 0), 0);
    const grade = [...school.grading].sort((a, b) => b.min - a.min).find(rule => total >= rule.min)?.letter || "F";
    return { updateOne: { filter: { school: req.user.school, student: item.student, subject: req.body.subject, session: req.body.session, term: req.body.term }, update: { $set: { ...item, school: req.user.school, subject: req.body.subject, className: req.body.className, session: req.body.session, term: req.body.term, total, grade, enteredBy: req.user.id } }, upsert: true } };
  });
  await Score.bulkWrite(operations);
  res.json({ message: "Scores saved" });
});
router.patch("/status", async (req, res) => {
  const allowed = { teacher: ["submitted"], form_master: ["reviewed"], admin: ["reviewed", "finalized", "draft"] };
  if (!allowed[req.user.role]?.includes(req.body.status)) return res.status(403).json({ message: "Invalid workflow action" });
  const result = await Score.updateMany({ school: req.user.school, className: req.body.className, session: req.body.session, term: req.body.term, ...(req.body.subject && { subject: req.body.subject }) }, { status: req.body.status });
  res.json({ message: "Result status updated", count: result.modifiedCount });
});
router.get("/report/:studentId", async (req, res) => {
  const scores = await Score.find({ school: req.user.school, student: req.params.studentId, session: req.query.session, term: req.query.term }).populate("student subject");
  const average = scores.length ? scores.reduce((sum, item) => sum + item.total, 0) / scores.length : 0;
  res.json({ student: scores[0]?.student, scores, average: Number(average.toFixed(2)), complete: scores.length > 0 && scores.every(item => item.status === "finalized") });
});
export default router;
