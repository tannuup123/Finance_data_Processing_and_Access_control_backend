const jwt = require("jsonwebtoken");

// Mock the User model
jest.mock("../backend/src/models/user.model", () => {
  return {
    findById: jest.fn(),
  };
});

const User = require("../backend/src/models/user.model");
const protect = require("../backend/src/middleware/auth");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    process.env.JWT_SECRET = "testsecret123";
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test("should return 401 if no token is provided", async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "No token provided, authorization denied",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if token is invalid", async () => {
    req.headers.authorization = "Bearer invalidtoken123";

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token",
    });
  });

  test("should call next() with valid token and active user", async () => {
    const token = jwt.sign({ id: "user123", role: "admin" }, "testsecret123");
    req.headers.authorization = `Bearer ${token}`;

    // Mock User.findById to return a chain with select
    const mockUser = {
      _id: "user123",
      role: "admin",
      name: "Test User",
      status: "active",
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe("admin");
  });

  test("should return 401 if user no longer exists", async () => {
    const token = jwt.sign({ id: "deleteduser", role: "admin" }, "testsecret123");
    req.headers.authorization = `Bearer ${token}`;

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "User no longer exists",
    });
  });

  test("should return 403 if user is inactive", async () => {
    const token = jwt.sign({ id: "inactiveuser", role: "admin" }, "testsecret123");
    req.headers.authorization = `Bearer ${token}`;

    const mockUser = {
      _id: "inactiveuser",
      role: "admin",
      name: "Inactive User",
      status: "inactive",
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Account is inactive. Contact admin.",
    });
  });

  test("should handle token without Bearer prefix", async () => {
    const token = jwt.sign({ id: "user123", role: "viewer" }, "testsecret123");
    req.headers.authorization = token;

    const mockUser = {
      _id: "user123",
      role: "viewer",
      name: "Test Viewer",
      status: "active",
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe("viewer");
  });
});
