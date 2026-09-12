import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { protect, allow } from "../middleware/auth.js";
import { Student, Subject, Assignment, ClassRoom, AcademicPeriod } from "../models/Academic.js";
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import Score from "../models/Score.js";
import School from "../models/School.js";

const router = express.Router();
router.use(protect);
async function teacherClasses(user) {
  if (user.role === "admin") return null;
  const [teaching,managed] = await Promise.all([
    Assignment.distinct("className", { school: user.school, teacher: user.id }),
    ClassRoom.distinct("name", { school: user.school, formMaster: user.id, active: true })
  ]);
  return [...new Set([...teaching, ...managed])];
}
async function isFormMaster(user, className) {
  return user.role === "admin" || Boolean(await ClassRoom.exists({ school: user.school, name: className, formMaster: user.id, active: true }));
}

const modelRoutes = [{ path: "students", Model: Student }, { path: "subjects", Model: Subject }];
for (const { path, Model } of modelRoutes) {
  router.get(`/${path}`, async (req, res) => {
    const filter = { school: req.user.school, active: { $ne: false } };
    if (req.user.role !== "admin") {
      const classes = await teacherClasses(req.user);
      if (path === "students") filter.className = { $in: classes };
      else filter._id = { $in: await Assignment.distinct("subject", { school: req.user.school, teacher: req.user.id }) };
    }
    res.json(await Model.find(filter).sort({ createdAt: -1 }));
  });
  router.post(`/${path}`, async (req, res) => {
    if (path === "subjects" && req.user.role !== "admin") return res.status(403).json({ message: "Only an Admin can add subjects" });
    if (path === "students" && !(await isFormMaster(req.user, req.body.className))) return res.status(403).json({ message: "Only the Form Master or School Admin can add students to this class" });
    const item = await Model.create({ ...req.body, school: req.user.school });
    await AuditLog.create({ school: req.user.school, user: req.user.id, action: `${path}.created`, entity: item.id, details: { className: req.body.className } });
    res.status(201).json(item);
  });
  router.put(`/${path}/:id`, async (req, res) => {
    if (path === "subjects" && req.user.role !== "admin") return res.status(403).json({ message: "Only an Admin can edit subjects" });
    if (path === "students") {
      const student = await Student.findOne({ _id: req.params.id, school: req.user.school });
      if (!student) return res.status(404).json({ message: "Student not found" });
      if (!(await isFormMaster(req.user, student.className))) return res.status(403).json({ message: "Only the Form Master or School Admin can edit this student" });
    }
    res.json(await Model.findOneAndUpdate({ _id: req.params.id, school: req.user.school }, req.body, { new: true, runValidators: true }));
  });
}
router.get("/teachers", allow("admin"), async (req, res) => res.json(await User.find({ school: req.user.school }).select("-password")));
router.post("/teachers", allow("admin"), async (req, res) => {
  const { name, email, password, active = true } = req.body;
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "Teacher name, email and password are required" });
  const teacher = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), active, role: "teacher", school: req.user.school, password: await bcrypt.hash(password, 10) });
  res.status(201).json(teacher);
});
router.patch("/teachers/:id/reset-password", allow("admin"), async (req, res) => {
  const teacher = await User.findOne({ _id: req.params.id, school: req.user.school, role: "teacher" }).select("+password");
  if (!teacher) return res.status(404).json({ message: "Teacher account not found" });
  const temporaryPassword = `SAA-${crypto.randomBytes(5).toString("base64url")}!`;
  teacher.password = await bcrypt.hash(temporaryPassword, 10);
  await teacher.save();
  await AuditLog.create({ school: req.user.school, user: req.user.id, action: "teacher.password_reset", entity: teacher.id, details: { teacherName: teacher.name } });
  res.json({ message: "A new temporary password was generated", temporaryPassword });
});
router.get("/assignments", async (req, res) => {
  const filter = { school: req.user.school };
  if (req.user.role !== "admin") filter.teacher = req.user.id;
  res.json(await Assignment.find(filter).populate("teacher subject"));
});
router.post("/assignments", allow("admin"), async (req, res) => {
  const { teacher, className, subject } = req.body;
  if (!teacher || !className?.trim() || !subject) return res.status(400).json({ message: "Teacher, class and subject are required" });
  const normalizedClass = className.trim();
  const [teacherRecord, classRecord, subjectRecord] = await Promise.all([
    User.findOne({ _id: teacher, school: req.user.school, role: "teacher", active: true }),
    ClassRoom.findOne({ school: req.user.school, name: normalizedClass, active: true }),
    Subject.findOne({ _id: subject, school: req.user.school })
  ]);
  if (!teacherRecord) return res.status(400).json({ message: "Select an active teacher from this school" });
  if (!classRecord) return res.status(400).json({ message: "Select an active class from this school" });
  if (!subjectRecord) return res.status(400).json({ message: "Select a subject from this school" });

  const duplicate = await Assignment.findOne({ school: req.user.school, className: normalizedClass, subject }).populate("teacher", "name");
  if (duplicate) return res.status(409).json({ message: `${subjectRecord.name} in ${normalizedClass} is already assigned to ${duplicate.teacher?.name || "another teacher"}` });

  const assignment = await Assignment.create({ teacher, className: normalizedClass, subject, school: req.user.school, isFormMaster: false });
  await AuditLog.create({ school: req.user.school, user: req.user.id, action: "assignment.created", entity: assignment.id, details: { teacher: teacherRecord.name, className: normalizedClass, subject: subjectRecord.name } });
  res.status(201).json(await assignment.populate("teacher subject"));
});
router.delete("/assignments/:id", allow("admin"), async (req, res) => {
  const item = await Assignment.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  if (!item) return res.status(404).json({ message: "Assignment not found" });
  res.json({ message: "Assignment removed" });
});
router.get("/classes", async (req, res) => {
  const filter = { school: req.user.school, active: { $ne: false } };
  if (req.user.role !== "admin") filter.name = { $in: await teacherClasses(req.user) };
  res.json(await ClassRoom.find(filter).populate("formMaster", "name email").sort({ name: 1 }));
});
router.patch("/classes/:id/form-master", allow("admin"), async (req, res) => {
  const teacher = await User.findOne({ _id: req.body.teacher, school: req.user.school, role: "teacher", active: true });
  if (!teacher) return res.status(400).json({ message: "Select an active teacher from this school" });
  const classroom = await ClassRoom.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school, active: true },
    { formMaster: teacher._id },
    { new: true, runValidators: true }
  ).populate("formMaster", "name email");
  if (!classroom) return res.status(404).json({ message: "Class not found" });
  await AuditLog.create({ school: req.user.school, user: req.user.id, action: "class.form_master_assigned", entity: classroom.id, details: { className: classroom.name, teacher: teacher.name } });
  res.json(classroom);
});
router.get("/form-master-classes", async (req, res) => {
  const filter = { school: req.user.school, active: true };
  if (req.user.role !== "admin") filter.formMaster = req.user.id;
  res.json(await ClassRoom.find(filter).sort({ name: 1 }));
});
router.get("/form-master-students", async (req, res) => {
  const filter = { school: req.user.school, active: true };
  if (req.user.role !== "admin") {
    const classes = await ClassRoom.distinct("name", { school: req.user.school, formMaster: req.user.id, active: true });
    filter.className = { $in: classes };
  }
  res.json(await Student.find(filter).sort({ className: 1, fullName: 1 }));
});
router.post("/classes", allow("admin"), async (req, res) => res.status(201).json(await ClassRoom.create({ ...req.body, school: req.user.school })));
router.get("/periods", async (req, res) => res.json(await AcademicPeriod.find({ school: req.user.school }).sort({ createdAt: -1 })));
router.post("/periods", allow("admin"), async (req, res) => res.status(201).json(await AcademicPeriod.create({ ...req.body, school: req.user.school })));
router.get("/audit-logs", allow("admin"), async (req, res) => res.json(await AuditLog.find({ school: req.user.school }).populate("user", "name").sort({ createdAt: -1 }).limit(250)));
router.get("/dashboard", async (req, res) => {
  const school = await School.findById(req.user.school);
  const assignmentFilter = { school: req.user.school, ...(req.user.role !== "admin" && { teacher: req.user.id }) };
  const assignments = await Assignment.find(assignmentFilter).populate("subject teacher", "name");
  const classNames = [...new Set(assignments.map(item => item.className))];
  const studentFilter = { school: req.user.school, active: true, ...(req.user.role !== "admin" && { className: { $in: classNames } }) };
  const [students, teachers, subjects, classes, activities] = await Promise.all([
    Student.countDocuments(studentFilter), User.countDocuments({ school: req.user.school, active: true, role: "teacher" }),
    req.user.role === "admin" ? Subject.countDocuments({ school: req.user.school }) : Promise.resolve(new Set(assignments.map(item => item.subject?._id?.toString())).size),
    req.user.role === "admin" ? ClassRoom.countDocuments({ school: req.user.school, active: true }) : Promise.resolve(classNames.length),
    AuditLog.find({ school: req.user.school, ...(req.user.role !== "admin" && { user: req.user.id }) }).populate("user", "name").sort({ createdAt: -1 }).limit(5)
  ]);
  const progress = await Promise.all(assignments.map(async assignment => {
    const [classSize, scoreRows] = await Promise.all([
      Student.countDocuments({ school: req.user.school, className: assignment.className, active: true }),
      Score.find({ school: req.user.school, className: assignment.className, subject: assignment.subject._id, session: school.activeSession, term: school.activeTerm })
    ]);
    return { assignmentId: assignment.id, className: assignment.className, subject: assignment.subject?.name, teacher: assignment.teacher?.name, completed: scoreRows.length, missing: Math.max(0, classSize - scoreRows.length), status: scoreRows[0]?.status || "draft" };
  }));
  const missing = progress.reduce((sum, item) => sum + item.missing, 0);
  const completed = progress.reduce((sum, item) => sum + item.completed, 0);
  const expected = progress.reduce((sum, item) => sum + item.completed + item.missing, 0);
  res.json({ stats: { students, teachers, subjects, classes, missing, assignments: assignments.length }, progress, completion: expected ? Math.round(completed / expected * 100) : 0, activities });
});
router.put("/settings", allow("admin"), async (req, res) => res.json(await School.findByIdAndUpdate(req.user.school, req.body, { new: true })));
export default router;
