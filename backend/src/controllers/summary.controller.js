const Record = require("../models/record.model");

/**
 * Get Total Income
 * Uses MongoDB Aggregation to swiftly calculate the sum of all 'income' records.
 * Much faster than pulling all records to Node.js and running an array .reduce()
 */
const getTotalIncome = async (req, res) => {
  try {
    const result = await Record.aggregate([
      { $match: { type: "income", isDeleted: false } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      totalIncome: result[0]?.totalIncome || 0,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating income",
    });
  }
};
//Total Expense
const getTotalExpense = async (req, res) => {
  try {
    const result = await Record.aggregate([
      { $match: { type: "expense", isDeleted: false } },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      totalExpense: result[0]?.totalExpense || 0,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating expense",
    });
  }
};
//Net Balance
const getNetBalance = async (req, res) => {
  try {
    const result = await Record.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    let income = 0;
    let expense = 0;

    result.forEach((item) => {
      if (item._id === "income") income = item.total;
      if (item._id === "expense") expense = item.total;
    });

    res.status(200).json({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating balance",
    });
  }
};
// Category Wise Breakdown
const getCategorySummary = async (req, res) => {
  try {
    const result = await Record.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching category summary",
    });
  }
};
// Recent Activity - last 10 records
const getRecentActivity = async (req, res) => {
  try {
    const records = await Record.find({ isDeleted: false })
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching recent activity",
      error: error.message,
    });
  }
};

/**
 * Monthly Trends (Income vs Expense grouped by Month and Year)
 * Generates data arrays perfect for line charts or bar graphs on the frontend.
 */
const getMonthlyTrends = async (req, res) => {
  try {
    const result = await Record.aggregate([
      { $match: { isDeleted: false } },
      {
        // Groups records by both Year and Month (e.g., April 2026)
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          // $cond operates like an IF statement. IF type == income, add amount to sum, else add 0.
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
          count: { $sum: 1 }, // Total transactions this month
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
    ]);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching monthly trends",
      error: error.message,
    });
  }
};

// Export
module.exports = {
  getTotalIncome,
  getTotalExpense,
  getNetBalance,
  getCategorySummary,
  getRecentActivity,
  getMonthlyTrends,
};