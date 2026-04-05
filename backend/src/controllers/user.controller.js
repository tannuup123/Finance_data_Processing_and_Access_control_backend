const User = require("../models/user.model");

/**
 * Get All Users (Admin Only)
 * Pro-feature: Uses `{ isDeleted: false }` so deleted users aren't sent to the frontend.
 * Pro-feature: `.select("-password")` is a security measure to NEVER send the hashed password hash in API responses.
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).select("-password");

    res.status(200).json({
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get Single User by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error: error.message,
    });
  }
};

/**
 * Update User (role, status, name)
 * Used by admin to upgrade someone to 'analyst' or 'admin', or to block them by setting status: 'inactive'.
 */
const updateUser = async (req, res) => {
  try {
    const { name, role, status } = req.body;

    // Validate role if provided
    if (role && !["viewer", "analyst", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'viewer', 'analyst', or 'admin'",
      });
    }

    // Validate status if provided
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'active' or 'inactive'",
      });
    }

    const updatedData = {};
    if (name) updatedData.name = name;
    if (role) updatedData.role = role;
    if (status) updatedData.status = status;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updatedData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating user",
      error: error.message,
    });
  }
};

/**
 * Soft Delete User
 * Preserves user data for database integrity but hides them from the system.
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User deleted successfully (soft delete)",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};