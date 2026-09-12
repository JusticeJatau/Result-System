import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  admissionNo: { type: String, required: true }, fullName: { type: String, required: true }, gender: String,
  className: { type: String, required: true }, session: String, active: { type: Boolean, default: true }
}, { timestamps: true });
studentSchema.index({ school: 1, admissionNo: 1 }, { unique: true });

const subjectSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  name: { type: String, required: true }, code: String, classes: [String]
}, { timestamps: true });

const assignmentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  className: { type: String, required: true }, subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  isFormMaster: { type: Boolean, default: false }
}, { timestamps: true });
assignmentSchema.index({ school: 1, className: 1, subject: 1 }, { unique: true });

const classSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  name: { type: String, required: true, trim: true }, level: String, arm: String,
  session: { type: String, required: true }, formMaster: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  active: { type: Boolean, default: true }
}, { timestamps: true });
classSchema.index({ school: 1, name: 1, session: 1 }, { unique: true });

const periodSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  session: { type: String, required: true }, term: { type: String, required: true },
  scoreEntryOpen: { type: Boolean, default: true }, deadline: Date, active: { type: Boolean, default: false }
}, { timestamps: true });
periodSchema.index({ school: 1, session: 1, term: 1 }, { unique: true });

export const Student = mongoose.model("Student", studentSchema);
export const Subject = mongoose.model("Subject", subjectSchema);
export const Assignment = mongoose.model("Assignment", assignmentSchema);
export const ClassRoom = mongoose.model("ClassRoom", classSchema);
export const AcademicPeriod = mongoose.model("AcademicPeriod", periodSchema);
