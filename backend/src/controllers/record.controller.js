const Record = require("../models/record.model");

/**
 * Create Record
 * Validates inputs and creates a new financial transaction.
 */
const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, note } = req.body;

    // Strict validation to prevent bad data
    if (!amount || !type || !category || !date) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    // Amount validation ensures calculations are safe later
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    // Type validation
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        message: "Invalid type. Must be 'income' or 'expense'",
      });
    }

    // Insert into DB. `createdBy` is safely pulled from the decoded JWT token via Auth middleware.
    const newRecord = await Record.create({
      amount,
      type,
      category: category.toLowerCase().trim(),
      date,
      note,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Record created successfully",
      data: newRecord,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get All Records (Pro-feature: Filtering, Search, Pagination, Soft-Delete awareness)
 * Provides a highly dynamic API for the frontend dashboard to fetch records.
 */
const getRecords = async (req, res) => {
  try {
    const { type, category, startDate, endDate, search, page, limit } = req.query;

    // Base filter: NEVER return records that have been soft-deleted.
    let filter = { isDeleted: false };

    // Standard Filters
    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          message: "Invalid type filter. Must be 'income' or 'expense'",
        });
      }
      filter.type = type;
    }

    if (category) {
      filter.category = category.toLowerCase();
    }

    // Date Range Filter (Useful for charts)
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate), // Greater than or equal to
        $lte: new Date(endDate),   // Less than or equal to
      };
    }

    // Pro-feature: Search by Text (Regex mapping on category or note fields)
    if (search) {
      filter.$or = [
        { category: { $regex: search, $options: "i" } }, // 'i' for case-insensitive
        { note: { $regex: search, $options: "i" } },
      ];
    }

    // Pro-feature: Pagination Math
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum; // e.g., page 2 with limit 10 -> skip first 10 records

    // Run count operation and fetch operation in parallel for efficiency
    const total = await Record.countDocuments(filter);
    const records = await Record.find(filter)
      .sort({ date: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limitNum);

    // Return rich envelope data useful for frontend table generation
    res.status(200).json({
      count: records.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching records",
      error: error.message,
    });
  }
};

// Get Single Record by ID
const getRecordById = async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, isDeleted: false });

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    res.status(200).json({
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching record",
      error: error.message,
    });
  }
};

/**
 * Update Record by ID
 * Note: Check `isDeleted: false` to ensure we don't accidentally resurrect or modify a deleted record.
 */
const updateRecord = async (req, res) => {
  try {
    const { amount, type, category, date, note } = req.body;

    // Optional fields validation
    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({
        message: "Invalid type. Must be 'income' or 'expense'",
      });
    }

    if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    const updatedData = {};
    if (amount !== undefined) updatedData.amount = amount;
    if (type) updatedData.type = type;
    if (category) updatedData.category = category.toLowerCase().trim();
    if (date) updatedData.date = date;
    if (note !== undefined) updatedData.note = note;

    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, // Security condition
      updatedData,
      { new: true, runValidators: true } // Returns the newly updated document instead of the old one
    );

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    res.status(200).json({
      message: "Record updated successfully",
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating record",
      error: error.message,
    });
  }
};

/**
 * Soft Delete Record by ID (Pro-feature)
 * Instead of completely destroying historical financial data, we simply set `isDeleted: true`.
 * This preserves records for audit compliance or potential recovery.
 */
const deleteRecord = async (req, res) => {
  try {
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true }, // The 'Soft Delete' flag
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    res.status(200).json({
      message: "Record deleted successfully (soft delete)",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting record",
      error: error.message,
    });
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};