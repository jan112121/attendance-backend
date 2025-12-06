import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import penaltyRoutes from "./routes/penaltyRoutes.js";
import penaltyRuleRoutes from "./routes/penaltyRuleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import levelRoutes from "./routes/levelRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import masterListRoutes from "./routes/masterListRoutes.js";
import archiveReportsRoutes from "./routes/archiveReportRoutes.js";
import dashboardDataRoutes from "./routes/dashboardDataRoutes.js";
import studentDashboardRoutes from "./routes/studentDashboardRoutes.js";

// Utilities
import "./utils/cronJobs.js";
import "./models/associations.js";

dotenv.config();

const app = express();

// ---------------------------
// Middleware
// ---------------------------

// Allowed frontend URLs
const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL, // Set in Railway / Vercel env
  "https://attendance-frontend-p3e5-2axnbj42d.vercel.app", // Vercel prod
  "https://effervescent-torte-e1e84c.netlify.app", // Netlify prod
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve uploaded files
app.use("/uploads", express.static("public/uploads"));

// ---------------------------
// Routes
// ---------------------------
app.use("/api/student-dashboard", studentDashboardRoutes);
app.use("/api/dashboard", dashboardDataRoutes);
app.use("/api/master-list", masterListRoutes);
app.use("/api/archive-reports", archiveReportsRoutes);
app.use("/api/school-levels", levelRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/penalties", penaltyRoutes);
app.use("/api/penalty-rules", penaltyRuleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

// Test route
app.get("/", (req, res) => res.send("Server is running ✅"));

// ---------------------------
// Database Sync & Server Start
// ---------------------------
const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synced ✅");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
