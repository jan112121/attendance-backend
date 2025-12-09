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

// CORS: allow only your frontend domain
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://aztecscan.site"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman / curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log("Blocked CORS request from:", origin);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsing
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
// Start server after DB connection
// ---------------------------
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate(); // test connection
    console.log("Database connected ✅");

    // DO NOT sync with alter in production
    // await sequelize.sync(); // optional if you want to sync tables (no alter)

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB connection error:", err);
  }
}

startServer();
