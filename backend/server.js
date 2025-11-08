// ------------------------------
// ✅ HACK.MCE 5.0 Backend (ESM)
// ------------------------------

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import checkinRoutes from "./routes/checkin.js";
import adminRoutes from "./routes/admin.js";

// Load environment variables
dotenv.config();

// Fix __dirname and __filename (not available in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ------------------------------
// Middleware
// ------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// MongoDB Connection
// ------------------------------
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/hackmce5";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log("📊 Database: hackmce5");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ------------------------------
// Routes
// ------------------------------
app.use("/api/checkin", checkinRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "HACK.MCE 5.0 Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, "..")));

// ------------------------------
// Error Handling
// ------------------------------
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// ------------------------------
// Server Start
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔥 HACK.MCE 5.0 - Registration System`);
});

