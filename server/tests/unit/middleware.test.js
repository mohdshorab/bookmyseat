const { protect } = require("../../src/middlewares/auth.middleware");
const { verifyToken } = require("../../src/utils/jwt");
const User = require("../../src/models/user.model");

jest.mock("../../src/utils/jwt");
jest.mock("../../src/models/user.model");

describe("Auth Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test("return 401 if no Authorization header", async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Unauthorized"
    }));
  });

  test("return 401 if header does not start with Bearer", async () => {
    req.headers.authorization = "Basic somehash";

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Unauthorized"
    }));
  });

  test("extract token correctly and set req.user if token is valid", async () => {
    const mockToken = "valid.token.here";
    const mockUser = { _id: "123", username: "shorab" };

    req.headers.authorization = `Bearer ${mockToken}`;

    verifyToken.mockReturnValue({ id: "123" });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    await protect(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith(mockToken);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  test("should return 401 if token is invalid", async () => {
    req.headers.authorization = "Bearer invalid-token";
    verifyToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401
    }));
  });
});
