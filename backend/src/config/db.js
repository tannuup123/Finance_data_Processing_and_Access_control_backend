const mongoose = require("mongoose");

/**
 * Database Connection Handler
 * Connects to MongoDB Atlas using the URI stored in the secure .env file.
 */
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Stop the server completely if the database is dead. App cannot function without it.
  }
};

module.exports = connectDatabase;