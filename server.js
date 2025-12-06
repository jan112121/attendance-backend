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

/**
 * ---------------------------
 * Middleware
 * ---------------------------
 */

// Enable CORS
const allowedOrigins = [
  "http://localhost:4200", // Angular dev server
  process.env.FRONTEND_URL, // Add your deployed frontend URL in .env
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS not allowed"));
    },
  })
);

sequelize
  .sync({ alter: true }) // <-- this creates tables if they don't exist
  .then(() => {
    console.log("Database synced");
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Server running on port ${process.env.PORT || 8080}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve uploaded files
app.use("/uploads", express.static("public/uploads"));

/**
 * ---------------------------
 * Routes
 * ---------------------------
 */

// Student Dashboard
app.use("/api/student-dashboard", studentDashboardRoutes);

// Admin Dashboard
app.use("/api/dashboard", dashboardDataRoutes);

// Master List
app.use("/api/master-list", masterListRoutes);

// Archive Reports
app.use("/api/archive-reports", archiveReportsRoutes);

// School Levels, Grades, Sections
app.use("/api/school-levels", levelRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/sections", sectionRoutes);

// Penalties
app.use("/api/penalties", penaltyRoutes);
app.use("/api/penalty-rules", penaltyRuleRoutes);

// Users
app.use("/api/users", userRoutes);

// Authentication
app.use("/api/auth", authRoutes);

// Attendance
app.use("/api/attendance", attendanceRoutes);

// Test route
app.get("/", (req, res) => res.send("Server is running ✅"));

/**
 * ---------------------------
 * Database Sync
 * ---------------------------
 */
sequelize
  .sync()
  .then(() => console.log("MySQL DB connected and tables synced"))
  .catch((err) => console.error("DB connection error:", err));

/**
 * ---------------------------
 * Start Server
 * ---------------------------
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
