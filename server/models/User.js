import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "teacher", "form_master"], required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ school: 1, email: 1 }, { unique: true });
export default mongoose.model("User", userSchema);
