const User = require("../models/user.model");
const { getHashedPass, verifyPass } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/jwt");
const { refreshCookieOptions } = require("../utils/cookies");
const sendApiResponse = require("../utils/sendApiResponse");

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const hashedPass = await getHashedPass(password, 10);

    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPass,
    });

    return sendApiResponse({
      status: 201,
      message: "Registered successfuly",
      res,
      props: {
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return sendApiResponse({
        status: 404,
        message: "User not found",
        res,
      });
    }
    const isPassVerified = await verifyPass(password, user.password);
    if (!isPassVerified) {
      return sendApiResponse({
        status: 401,
        message: "Wrong credentials",
        res,
      });
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    return sendApiResponse({
      status: 200,
      message: "Logged in successfully",
      res: res.cookie("refreshToken", refreshToken, refreshCookieOptions),
      props: { accessToken }
    });
  } catch (e) {
    next(e);
  }
};

exports.refresh = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    if (!refreshToken) {
      return sendApiResponse({
        status: 401,
        message: "Refresh token not found",
        res,
      });
    }

    const verified = verifyToken(refreshToken);

    if (!verified) {
      return sendApiResponse({
        status: 401,
        message: "Invalid or expired refresh token",
        res,
      });
    }

    const user = await User.findById(verified.id);
    if (!user) {
      return sendApiResponse({
        status: 401,
        message: "User no longer exists",
        res,
      });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return sendApiResponse({
      status: 200,
      message: "Token generated successfuly",
      res: res.cookie("refreshToken", newRefreshToken, refreshCookieOptions),
      props: { accessToken },
    });
  } catch (e) {
    next(e);
  }
};

exports.logout = async (req, res, next) => {
  try {
    return sendApiResponse({
      status: 200,
      message: "Logged out successfuly",
      res: res.clearCookie("refreshToken", refreshCookieOptions),
    });
  } catch (e) {
    next(e);
  }
};
