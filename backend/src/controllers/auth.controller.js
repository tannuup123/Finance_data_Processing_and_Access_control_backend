const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Register User API
 * Creates a new user in the database. Defaults to 'viewer' role to prevent immediate access escalation.
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Validate role if provided
    if (role && !["viewer", "analyst", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'viewer', 'analyst', or 'admin'",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "viewer",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};

/**
 * Login User API
 * Validates credentials and returns a secure JWT token for subsequent API calls.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Security: Check matching hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials", // Always give generic error messages on login to prevent email enumeration
      });
    }

    // Generate JWT Token encoding the User ID and their Role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 24 hours for security
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Login error",
      error: error.message,
    });
  }
};
//export
module.exports = {
  registerUser,
  loginUser,
};