/**
 * Application Entry Point (server.js)
 * Sets up Express, connects to MongoDB, configures global middleware,
 * and mounts the API routes. Handles server bootstrapping.
 */
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDatabase = require("./src/config/db");
const userRoutes = require("./src/routes/user.routes");
const recordRoutes = require("./src/routes/record.routes");
const summaryRoutes = require("./src/routes/summary.routes");
const authRoutes = require("./src/routes/auth.routes");
const { apiLimiter, authLimiter } = require("./src/middleware/rateLimiter");

// Load environment variables from backend/.env
dotenv.config({ path: "./backend/.env" });

// Connect to database
connectDatabase();

const app = express();


// Global Middleware
app.use(express.json()); // Parses incoming JSON payloads
app.use(cors()); // Enables Cross-Origin Resource Sharing for frontend integration

// Security Feature: Rate Limiting
// Protects the global API routes from DDoS or aggressive scraping (100 req per 15 minutes)
app.use("/api", apiLimiter);

// Route Mounting
// Connects URL endpoints to their specific router modules
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/summary", summaryRoutes);
// Auth routes get stricter rate limiting (20 req per 15 mins) to prevent brute-force password guessing
app.use("/api/auth", authLimiter, authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});