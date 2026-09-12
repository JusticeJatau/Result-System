import mongoose from "mongoose";

const platformAdminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  active: { type: Boolean, default: true },
  lastLoginAt: Date
}, { timestamps: true });

export default mongoose.model("PlatformAdmin", platformAdminSchema);
