import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import platformRoutes from "./routes/platformRoutes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json()); app.use(morgan("dev"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes); app.use("/api/platform", platformRoutes); app.use("/api", academicRoutes); app.use("/api/scores", scoreRoutes);
app.use((error, _req, res, _next) => {
  if (error?.code === 11000) return res.status(409).json({ message: "A record with these details already exists" });
  res.status(error.status || 400).json({ message: error.message || "Something went wrong" });
});
export default app;
if (process.env.NODE_ENV !== "test") connectDB().then(() => app.listen(process.env.PORT || 5000, () => console.log(`Server running on http://localhost:${process.env.PORT || 5000}`))).catch(console.error);
