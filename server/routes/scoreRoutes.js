import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/auth.js";
import Score from "../models/Score.js";
import School from "../models/School.js";
import AuditLog from "../models/AuditLog.js";
import { AcademicPeriod, Assignment, ClassRoom, Student, Subject } from "../models/Academic.js";

const router = express.Router();
router.use(protect);
const validId = value => mongoose.Types.ObjectId.isValid(value);

async function canManage(user, className, subject) {
  if (user.role === "admin") return true;
  if (!validId(subject)) return false;
  return Boolean(await Assignment.exists({ school: user.school, teacher: user.id, className, subject }));
}

router.get("/sheet", async (req, res) => {
  const { className, subject, session, term } = req.query;
  if (!className || !validId(subject) || !session || !term) return res.status(400).json({ message: "Select a valid class, subject and period" });
  if (!(await canManage(req.user, className, subject))) return res.status(403).json({ message: "This class and subject are not assigned to you" });
  const [students, scores] = await Promise.all([
    Student.find({ school: req.user.school, className, active: true }).sort({ fullName: 1 }),
    Score.find({ school: req.user.school, className, subject, session, term })
  ]);
  const byStudent = new Map(scores.map(score => [score.student.toString(), score]));
  res.json(students.map(student => ({ student, score: byStudent.get(student.id) || null })));
});

router.post("/save", async (req, res) => {
  const { className, subject, session, term, scores = [] } = req.body;
  if (!className || !validId(subject) || !session || !term || !Array.isArray(scores)) return res.status(400).json({ message: "The score sheet information is incomplete" });
  if (!(await canManage(req.user, className, subject))) return res.status(403).json({ message: "You cannot manage this class or subject" });
  if (req.user.role !== "admin") {
    const period = await AcademicPeriod.findOne({ school: req.user.school, session, term });
    if (!period?.scoreEntryOpen || (period.deadline && new Date(period.deadline) < new Date())) return res.status(403).json({ message: "Score entry is closed for this academic period" });
  }
  const [school, subjectRecord, classStudents, existing] = await Promise.all([
    School.findById(req.user.school), Subject.findOne({ _id: subject, school: req.user.school }),
    Student.find({ school: req.user.school, className, active: true }).select("_id"),
    Score.find({ school: req.user.school, className, subject, session, term }).select("student status")
  ]);
  if (!school || !subjectRecord) return res.status(404).json({ message: "School or subject was not found" });
  const studentIds = new Set(classStudents.map(item => item.id));
  const lockedStudents = new Set(existing.filter(item => ["submitted", "reviewed", "finalized"].includes(item.status)).map(item => item.student.toString()));
  const maxByName = Object.fromEntries(school.assessment.map(item => [item.name, Number(item.maxScore)]));
  if (!Object.keys(maxByName).length) return res.status(400).json({ message: "Configure assessment components before entering scores" });
  const operations = [];
  for (const item of scores) {
    if (!validId(item.student) || !studentIds.has(String(item.student))) return res.status(400).json({ message: "A student does not belong to the selected class" });
    if (req.user.role !== "admin" && lockedStudents.has(String(item.student))) return res.status(403).json({ message: "This score sheet is locked. Ask an Admin to reopen it" });
    const components = {};
    for (const [name, raw] of Object.entries(item.components || {})) {
      if (!Object.hasOwn(maxByName, name)) return res.status(400).json({ message: `${name} is not a configured assessment component` });
      if (raw === "" || raw === null || raw === undefined) continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > maxByName[name]) return res.status(400).json({ message: `${name} must be between 0 and ${maxByName[name]}` });
      components[name] = value;
    }
    const total = Object.values(components).reduce((sum, value) => sum + value, 0);
    const grade = [...school.grading].sort((a, b) => b.min - a.min).find(rule => total >= rule.min)?.letter || "F";
    operations.push({ updateOne: { filter: { school: req.user.school, student: item.student, subject, session, term }, update: { $set: { school: req.user.school, student: item.student, subject, className, session, term, components, total, grade, enteredBy: req.user.id }, $setOnInsert: { status: "draft" } }, upsert: true } });
  }
  if (operations.length) await Score.bulkWrite(operations);
  await AuditLog.create({ school: req.user.school, user: req.user.id, action: "scores.saved", entity: subject, details: { className, subject: subjectRecord.name, count: operations.length } });
  res.json({ message: "Scores saved", count: operations.length });
});

router.patch("/status", async (req, res) => {
  const { className, subject, session, term } = req.body;
  const status = String(req.body.status || "").toLowerCase();
  if (!["draft", "submitted", "reviewed", "finalized"].includes(status)) return res.status(400).json({ message: "Invalid result status" });
  if (req.user.role !== "admin") {
    if (status === "submitted" && !(await canManage(req.user, className, subject))) return res.status(403).json({ message: "This score sheet is not assigned to you" });
    if (status === "reviewed" && !(await ClassRoom.exists({ school: req.user.school, name: className, formMaster: req.user.id, active: true }))) return res.status(403).json({ message: "You are not the Form Master of this class" });
    if (!["submitted", "reviewed"].includes(status)) return res.status(403).json({ message: "This workflow action is not permitted" });
  }
  const filter = { school: req.user.school, className, session, term, ...(subject && { subject }) };
  const rows = await Score.find(filter);
  if (!rows.length) return res.status(404).json({ message: "No scores were found for this selection" });
  if (subject && ["submitted", "reviewed", "finalized"].includes(status)) {
    const school = await School.findById(req.user.school);
    const required = school.assessment.map(item => item.name);
    const count = await Student.countDocuments({ school: req.user.school, className, active: true });
    if (rows.length < count || rows.some(row => required.some(name => row.components?.get(name) === undefined))) return res.status(400).json({ message: "Complete every student's assessment scores before submission" });
  }
  if (status === "finalized") {
    const subjectIds = await Assignment.distinct("subject", { school: req.user.school, className });
    const studentCount = await Student.countDocuments({ school: req.user.school, className, active: true });
    for (const id of subjectIds) if (await Score.countDocuments({ school: req.user.school, className, subject: id, session, term, status: { $in: ["submitted", "reviewed", "finalized"] } }) < studentCount) return res.status(400).json({ message: "Every assigned subject must be submitted before finalization" });
  }
  const result = await Score.updateMany(filter, { status });
  await AuditLog.create({ school: req.user.school, user: req.user.id, action: `scores.${status}`, details: { className, count: result.modifiedCount } });
  res.json({ message: "Result status updated", count: result.modifiedCount });
});

router.get("/class-summary", async (req, res) => {
  const { className, session, term } = req.query;
  if (req.user.role !== "admin" && !(await ClassRoom.exists({ school: req.user.school, name: className, formMaster: req.user.id, active: true }))) return res.status(403).json({ message: "You are not the Form Master of this class" });
  const [assignments, studentCount] = await Promise.all([Assignment.find({ school: req.user.school, className }).populate("subject teacher", "name code"), Student.countDocuments({ school: req.user.school, className, active: true })]);
  res.json(await Promise.all(assignments.map(async assignment => { const scores = await Score.find({ school: req.user.school, className, subject: assignment.subject._id, session, term }).populate("enteredBy", "name"); return { subject: assignment.subject, teacher: assignment.teacher, scores, completed: scores.length, missing: Math.max(0, studentCount - scores.length), status: scores[0]?.status || "draft" }; })));
});

router.get("/report/:studentId", async (req, res) => {
  if (!validId(req.params.studentId)) return res.status(400).json({ message: "Invalid student" });
  const student = await Student.findOne({ _id: req.params.studentId, school: req.user.school });
  if (!student) return res.status(404).json({ message: "Student not found" });
  if (req.user.role !== "admin" && !(await ClassRoom.exists({ school: req.user.school, name: student.className, formMaster: req.user.id, active: true }))) return res.status(403).json({ message: "You cannot view this class report" });
  const scores = await Score.find({ school: req.user.school, student: student._id, session: req.query.session, term: req.query.term }).populate("subject", "name code");
  const average = scores.length ? scores.reduce((sum, item) => sum + item.total, 0) / scores.length : 0;
  const classmates = await Student.find({ school: req.user.school, className: student.className, active: true }).select("_id");
  const averages = await Promise.all(classmates.map(async classmate => { const rows = await Score.find({ school: req.user.school, student: classmate._id, session: req.query.session, term: req.query.term }); return { id: classmate.id, average: rows.length ? rows.reduce((sum, row) => sum + row.total, 0) / rows.length : 0 }; }));
  averages.sort((a, b) => b.average - a.average);
  res.json({ student, scores, average: Number(average.toFixed(2)), position: averages.findIndex(item => item.id === student.id) + 1, classSize: classmates.length, total: scores.reduce((sum, item) => sum + item.total, 0), passed: scores.filter(item => item.total >= 40).length, complete: scores.length > 0 && scores.every(item => item.status === "finalized") });
});

export default router;
