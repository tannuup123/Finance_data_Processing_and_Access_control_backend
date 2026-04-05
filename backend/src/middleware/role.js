/**
 * Role-Based Access Control (RBAC) Middleware
 * This pro-feature restricts access to specific routes based on the logged-in user's role.
 * Example: authorizeRoles("admin", "analyst") means only Admins and Analysts can proceed.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }
    next();
  };
};

module.exports = authorizeRoles;