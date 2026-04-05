const mongoose = require("mongoose");

/**
 * Record Model
 * Represents a single financial transaction (Income or Expense)
 * Pro-feature: Soft delete mechanism is used instead of permanent data destruction.
 */
const recordSchema = new mongoose.Schema(
  {
    // The transaction amount. Must be positive (validated in controller)
    amount: {
      type: Number,
      required: true,
    },

    // Financial transaction type restricted to specific enums for clean data
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    // Category of the transaction (e.g., 'salary', 'food', 'rent')
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Date when the transaction occurred
    date: {
      type: Date,
      required: true,
    },

    // Optional user note or description
    note: {
      type: String,
      trim: true,
    },

    // Relationship: Links the record to the User who created it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Pro-feature: Soft Delete flag.
    // Instead of completely deleting a record from DB, we mark it as deleted to preserve history.
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Record", recordSchema);