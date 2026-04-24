const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret isn't defined");
  }

  return process.env.JWT_SECRET;
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: "7d",
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
