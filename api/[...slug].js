// Vercel serverless function - catch-all for all API routes
// This file handles all /api/* routes automatically
// The slug parameter contains the rest of the path after /api/
import app from "../backend/server.js";

// Export the Express app - Vercel will pass requests with the full path preserved
export default app;

