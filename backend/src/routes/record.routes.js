const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../controllers/record.controller");

/**
 * Record Route Definitions
 * Shows how middlewares are chained vertically.
 * 1. `protect`: Checks if user is logged in (valid token).
 * 2. `authorizeRoles`: Checks if the user's role is allowed to hit this specific endpoint.
 */

// Admin only - Can create, update, and soft-delete financial records
router.post("/create", protect, authorizeRoles("admin"), createRecord);
router.put("/:id", protect, authorizeRoles("admin"), updateRecord);
router.delete("/:id", protect, authorizeRoles("admin"), deleteRecord);

// Analyst + Admin - Can passively read/search/filter all records
router.get("/", protect, authorizeRoles("admin", "analyst"), getRecords);
router.get("/:id", protect, authorizeRoles("admin", "analyst"), getRecordById);

module.exports = router;