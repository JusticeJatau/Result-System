import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  className: String, session: String, term: String,
  components: { type: Map, of: Number, default: {} }, total: { type: Number, default: 0 }, grade: String,
  status: { type: String, enum: ["draft", "submitted", "reviewed", "finalized"], default: "draft" },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
scoreSchema.index({ school: 1, student: 1, subject: 1, session: 1, term: 1 }, { unique: true });
export default mongoose.model("Score", scoreSchema);
