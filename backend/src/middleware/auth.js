const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Authentication Middleware (JWT)
 * Verifies the validity of the JWT token sent in the Authorization header.
 * Pro-feature: It also checks the database in real-time to ensure the user wasn't deleted
 * or marked as "inactive" after the token was issued.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (supports "Bearer <token>" and raw token)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.authorization) {
    token = req.headers.authorization;
  }

  if (!token) {
    return res.status(401).json({
      message: "No token provided, authorization denied",
    });
  }

  try {
    // Verify token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pro-feature: Check if user still exists and is not soft-deleted.
    // .select("-password") ensures we don't accidentally pull or expose the hashed password.
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    // Pro-feature: Even if the token is valid, if an admin marked this user as inactive, block them immediately.
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Account is inactive. Contact admin.",
      });
    }

    // Attach minimal user info to the req object so downstream controllers know WHO is making the request.
    req.user = { id: user._id, role: user.role, name: user.name };
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = protect;