const User = require("../models/user.model");
const { verifyToken } = require("../utils/jwt");
const sendApiresponse = require("../utils/sendApiResponse");

exports.protect = async (req, res, next) => {
  try {
    const authString = req.headers.authorization;
    if (!authString || !authString.startsWith("Bearer ")) {
      return sendApiresponse({
        status: 401,
        message: "Unauthorized",
        res,
      });
    }

    const token = authString.split(" ")[1];
    if (!token) {
      return sendApiresponse({
        status: 401,
        message: "Unauthorized",
        res,
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return sendApiresponse({
        status: 401,
        message: "User not found",
        res,
      });
    }
    req.user = user;
    next();
  } catch (e) {
    e.statusCode = 401;

    if (e.name === "TokenExpiredError") {
      e.message = "Session expired. Please login again.";
    } else {
      e.message = "Invalid token. Access denied.";
    }

    next(e);
  }
};

exports.checkForAdmin = (req, res, next) => {
  const user = req.user;
  if (user.role !== "admin") {
    return sendApiresponse({
      status: 403,
      message: "Admin only",
      res,
    });
  }
  next();
};

exports.checkForSuperAdmin = (req, res, next) => {
  const user = req.user;
  if (user.role !== "super") {
    return sendApiresponse({
      status: 403,
      message: "Access Denied",
      res,
    });
  }
  next();
};

exports.checkForUser = (req, res, next) => {
  const user = req.user;
  
  if (user.role !== "user") {
    return sendApiresponse({
      status: 403,
      message: "Administrative accounts cannot perform this action. Please use a customer account.",
      res,
    });
  }
  next();
};