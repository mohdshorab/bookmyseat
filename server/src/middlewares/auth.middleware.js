const User = require("../models/user.model");
const { verifyToken } = require("../utils/jwt");

exports.protect = async (req, res, next) => {
  try {
    const authString = req.headers.authorization;
    if (!authString) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authString.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    req.user = user;
    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(500).json({
        success: false,
        message: "Token Expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Invalid token",
    });
  }
};

exports.checkForAdmin = (req, res, next) => {
  const user = req.user;
  if (user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }
  next();
};
