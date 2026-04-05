/**
 * User Routes
 * Used by the system administrator to manage staff accounts and roles.
 */
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

// All user management routes are Admin only
router.get("/", protect, authorizeRoles("admin"), getUsers);
router.get("/:id", protect, authorizeRoles("admin"), getUserById);
router.put("/:id", protect, authorizeRoles("admin"), updateUser);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

module.exports = router;