import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db.js";
import path from "path";

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
const PORT = process.env.PORT || 5000;

// ---------------------------
// Middleware
// ---------------------------

// CORS setup
const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://attendance-frontend-p3e5.vercel.app"
];

// Add FRONTEND_URL if defined
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  console.log("Allowed frontend origin:", process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / curl requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log("Blocked CORS request from:", origin);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true, // allow cookies / auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ---------------------------
// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static("public/uploads"));

// ---------------------------
// API Routes
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

// ---------------------------
// SPA fallback for Angular
// Must come after API routes
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

// ---------------------------
// Database Sync & Server Start
const isProduction = process.env.NODE_ENV === "production";
sequelize
  .sync({ alter: !isProduction }) // only auto-alter in dev
  .then(() => {
    console.log("Database synced ✅");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("DB connection error:", err));
