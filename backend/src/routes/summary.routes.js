/**
 * Summary / Dashboard Routes
 * Supplies calculated metrics for the frontend analytics UI.
 * Accessible by all logged-in roles (Viewer, Analyst, Admin).
 */
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

const {
  getTotalIncome,
  getTotalExpense,
  getNetBalance,
  getCategorySummary,
  getRecentActivity,
  getMonthlyTrends,
} = require("../controllers/summary.controller");

// All authenticated users (viewer, analyst, admin) can access dashboard summaries
router.get("/income", protect, authorizeRoles("admin", "analyst", "viewer"), getTotalIncome);
router.get("/expense", protect, authorizeRoles("admin", "analyst", "viewer"), getTotalExpense);
router.get("/balance", protect, authorizeRoles("admin", "analyst", "viewer"), getNetBalance);
router.get("/category", protect, authorizeRoles("admin", "analyst", "viewer"), getCategorySummary);
router.get("/recent", protect, authorizeRoles("admin", "analyst", "viewer"), getRecentActivity);
router.get("/trends", protect, authorizeRoles("admin", "analyst", "viewer"), getMonthlyTrends);

module.exports = router;