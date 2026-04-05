// Mock the Record model
jest.mock("../backend/src/models/record.model", () => {
  return {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };
});

const Record = require("../backend/src/models/record.model");
const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../backend/src/controllers/record.controller");

describe("Record Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: "admin123", role: "admin" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // ─── CREATE RECORD ───
  describe("createRecord", () => {
    test("should return 400 if required fields are missing", async () => {
      req.body = { amount: 500 }; // missing type, category, date

      await createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "All required fields must be provided",
      });
    });

    test("should return 400 if amount is not a positive number", async () => {
      req.body = { amount: -100, type: "income", category: "salary", date: "2026-04-01" };

      await createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Amount must be a positive number",
      });
    });

    test("should return 400 if type is invalid", async () => {
      req.body = { amount: 100, type: "bonus", category: "salary", date: "2026-04-01" };

      await createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid type. Must be 'income' or 'expense'",
      });
    });

    test("should create record successfully with valid data", async () => {
      req.body = {
        amount: 5000,
        type: "income",
        category: "Salary",
        date: "2026-04-01",
        note: "April salary",
      };

      const mockRecord = {
        _id: "rec123",
        ...req.body,
        category: "salary",
        createdBy: "admin123",
      };
      Record.create.mockResolvedValue(mockRecord);

      await createRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Record created successfully",
        data: mockRecord,
      });
      expect(Record.create).toHaveBeenCalledWith({
        amount: 5000,
        type: "income",
        category: "salary",
        date: "2026-04-01",
        note: "April salary",
        createdBy: "admin123",
      });
    });
  });

  // ─── GET RECORDS ───
  describe("getRecords", () => {
    test("should return 400 for invalid type filter", async () => {
      req.query = { type: "invalid" };

      await getRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return paginated records with defaults", async () => {
      Record.countDocuments.mockResolvedValue(25);
      Record.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ _id: "r1" }, { _id: "r2" }]),
          }),
        }),
      });

      await getRecords(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.total).toBe(25);
      expect(responseData.page).toBe(1);
      expect(responseData.totalPages).toBe(3); // ceil(25/10)
    });

    test("should apply search filter", async () => {
      req.query = { search: "food" };

      Record.countDocuments.mockResolvedValue(2);
      Record.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await getRecords(req, res);

      expect(Record.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { category: { $regex: "food", $options: "i" } },
            { note: { $regex: "food", $options: "i" } },
          ],
        })
      );
    });
  });

  // ─── GET RECORD BY ID ───
  describe("getRecordById", () => {
    test("should return 404 if record not found", async () => {
      req.params = { id: "nonexistent" };
      Record.findOne.mockResolvedValue(null);

      await getRecordById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Record not found",
      });
    });

    test("should return record if found", async () => {
      req.params = { id: "rec123" };
      const mockRecord = { _id: "rec123", amount: 500, type: "income" };
      Record.findOne.mockResolvedValue(mockRecord);

      await getRecordById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockRecord });
    });
  });

  // ─── UPDATE RECORD ───
  describe("updateRecord", () => {
    test("should return 400 for invalid type on update", async () => {
      req.params = { id: "rec123" };
      req.body = { type: "invalid" };

      await updateRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 for invalid amount on update", async () => {
      req.params = { id: "rec123" };
      req.body = { amount: -50 };

      await updateRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 404 if record not found for update", async () => {
      req.params = { id: "rec123" };
      req.body = { amount: 1000 };
      Record.findOneAndUpdate.mockResolvedValue(null);

      await updateRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should update record successfully", async () => {
      req.params = { id: "rec123" };
      req.body = { amount: 7500 };
      const mockUpdated = { _id: "rec123", amount: 7500 };
      Record.findOneAndUpdate.mockResolvedValue(mockUpdated);

      await updateRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Record updated successfully",
        data: mockUpdated,
      });
    });
  });

  // ─── DELETE (SOFT DELETE) RECORD ───
  describe("deleteRecord", () => {
    test("should return 404 if record not found", async () => {
      req.params = { id: "rec123" };
      Record.findOneAndUpdate.mockResolvedValue(null);

      await deleteRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should soft delete record successfully", async () => {
      req.params = { id: "rec123" };
      Record.findOneAndUpdate.mockResolvedValue({ _id: "rec123", isDeleted: true });

      await deleteRecord(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Record deleted successfully (soft delete)",
      });
    });
  });
});
