import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, entity: String,
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);
