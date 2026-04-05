const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Model
 * Represents an authenticated user in the system with Role Based Access Control (RBAC).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // RBAC Implementation: Determines what level of access the user has across the API.
    role: {
      type: String,
      enum: ["viewer", "analyst", "admin"],
      default: "viewer", // Safe default so new registrations don't automatically get full access
    },

    // Admin can toggle status. Inactive users get blocked by the auth middleware instantly.
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Pro-feature: Soft Delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mongoose Pre-save Hook (Password Hashing)
 * Automatically hashes the user's password using bcrypt before saving it to the database.
 * This runs anytime a user is created or when their password is changed.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


module.exports = mongoose.model("User", userSchema);