// Mock the User model
jest.mock("../backend/src/models/user.model", () => {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

const User = require("../backend/src/models/user.model");
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../backend/src/controllers/user.controller");

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // ─── GET ALL USERS ───
  describe("getUsers", () => {
    test("should return all non-deleted users", async () => {
      const mockUsers = [
        { _id: "u1", name: "Alice", role: "admin" },
        { _id: "u2", name: "Bob", role: "viewer" },
      ];
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        count: 2,
        data: mockUsers,
      });
      expect(User.find).toHaveBeenCalledWith({ isDeleted: false });
    });
  });

  // ─── GET USER BY ID ───
  describe("getUserById", () => {
    test("should return 404 if user not found", async () => {
      req.params = { id: "nonexistent" };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    test("should return user if found", async () => {
      req.params = { id: "u1" };
      const mockUser = { _id: "u1", name: "Alice", role: "admin" };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockUser });
    });
  });

  // ─── UPDATE USER ───
  describe("updateUser", () => {
    test("should return 400 for invalid role", async () => {
      req.params = { id: "u1" };
      req.body = { role: "superadmin" };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid role. Must be 'viewer', 'analyst', or 'admin'",
      });
    });

    test("should return 400 for invalid status", async () => {
      req.params = { id: "u1" };
      req.body = { status: "banned" };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid status. Must be 'active' or 'inactive'",
      });
    });

    test("should return 404 if user not found for update", async () => {
      req.params = { id: "u1" };
      req.body = { role: "analyst" };
      User.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should update user successfully", async () => {
      req.params = { id: "u1" };
      req.body = { role: "analyst", status: "inactive" };
      const mockUpdated = { _id: "u1", name: "Alice", role: "analyst", status: "inactive" };
      User.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdated),
      });

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User updated successfully",
        data: mockUpdated,
      });
    });
  });

  // ─── SOFT DELETE USER ───
  describe("deleteUser", () => {
    test("should return 404 if user not found", async () => {
      req.params = { id: "u1" };
      User.findOneAndUpdate.mockResolvedValue(null);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should soft delete user successfully", async () => {
      req.params = { id: "u1" };
      User.findOneAndUpdate.mockResolvedValue({ _id: "u1", isDeleted: true });

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully (soft delete)",
      });
    });
  });
});
