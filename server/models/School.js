import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  address: String,
  motto: String,
  logoUrl: String,
  activeSession: String,
  activeTerm: String,
  status: { type: String, enum: ["active", "suspended", "archived"], default: "active" },
  plan: { type: String, default: "starter" },
  billingCycle: { type: String, enum: ["monthly", "termly", "annual", "custom"], default: "monthly" },
  price: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: "NGN" },
  subscriptionEndsAt: Date,
  calculatePosition: { type: Boolean, default: true },
  assessment: { type: [{ name: String, maxScore: Number }], default: [{ name: "CA", maxScore: 40 }, { name: "Exam", maxScore: 60 }] },
  grading: { type: [{ letter: String, min: Number, remark: String }], default: [
    { letter: "A", min: 70, remark: "Excellent" }, { letter: "B", min: 60, remark: "Very Good" },
    { letter: "C", min: 50, remark: "Good" }, { letter: "D", min: 45, remark: "Fair" },
    { letter: "E", min: 40, remark: "Pass" }, { letter: "F", min: 0, remark: "Fail" }
  ] }
}, { timestamps: true });
export default mongoose.model("School", schoolSchema);
