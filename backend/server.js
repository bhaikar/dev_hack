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

// Fix __dirname and __filename (not available in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file (only if not on Vercel)
// On Vercel, environment variables are set directly, no .env file needed
if (!process.env.VERCEL) {
  // Explicitly specify the path to .env file in the backend directory
  dotenv.config({ path: path.join(__dirname, ".env") });
  console.log("✅ Loaded environment variables from .env file");
} else {
  console.log("✅ Using environment variables from Vercel");
}

const app = express();

// ------------------------------
// Middleware
// ------------------------------
// CORS configuration - allow all origins for Vercel deployment
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// MongoDB Connection
// ------------------------------
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/hackmce5";

// Log MongoDB URI (hide password for security)
if (process.env.MONGODB_URI) {
  const uriDisplay = process.env.MONGODB_URI.replace(
    /:([^:@]+)@/,
    ":****@"
  );
  console.log("📊 MongoDB URI configured:", uriDisplay);
} else {
  console.warn("⚠️ MONGODB_URI not set, using default localhost");
}

// Connect to MongoDB (async, non-blocking for serverless)
let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
      }

      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });
      isConnected = true;
      console.log("✅ Connected to MongoDB");
      console.log("📊 Database: hackmce5");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      isConnected = false;
      connectionPromise = null; // Reset to allow retry
      throw err;
    }
  })();

  return connectionPromise;
};

// Connect on first request (serverless-friendly)
app.use(async (req, res, next) => {
  try {
    if (!isConnected && mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    // Log error but continue (for serverless cold starts)
    console.error("⚠️ MongoDB connection failed, request may fail:", err.message);
  }
  next();
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

// 404 handler - must be last, after all routes
// This catches any unmatched routes
app.use((req, res) => {
  // Only return JSON for API routes
  if (req.path.startsWith("/api")) {
    res.status(404).json({
      success: false,
      message: "Endpoint not found",
      path: req.path,
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Not found",
    });
  }
});

// ------------------------------
// Server Start (Local Development Only)
// ------------------------------
// For Vercel, we export the app as a serverless function
// For local development, we start a server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  
  // Connect to MongoDB for local development
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🔥 HACK.MCE 5.0 - Registration System`);
    });
  });
}

// ------------------------------
// Export for Vercel Serverless Functions
// ------------------------------
export default app;

