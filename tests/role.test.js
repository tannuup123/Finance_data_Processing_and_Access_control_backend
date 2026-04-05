const { authorizeRoles } = (() => {
  const authorizeRoles = require("../backend/src/middleware/role");
  return { authorizeRoles };
})();

describe("Role Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { role: "admin" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("should call next() if user role is allowed", () => {
    const middleware = authorizeRoles("admin", "analyst");
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("should return 403 if user role is not allowed", () => {
    req.user.role = "viewer";
    const middleware = authorizeRoles("admin");
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access denied",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should allow multiple roles", () => {
    req.user.role = "analyst";
    const middleware = authorizeRoles("admin", "analyst", "viewer");
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("should deny access when no roles match", () => {
    req.user.role = "viewer";
    const middleware = authorizeRoles("admin", "analyst");
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
