const User = require("../models/user.model");
const { getHashedPass, verifyPass } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/jwt");
const { refreshCookieOptions } = require("../utils/cookies");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const isUserExist = await User.findOne({ email: email });
    if (isUserExist) {
      return res.status(409).json({
        success: false,
        message: "User with this email already existed",
      });
    }
    const hashedPass = await getHashedPass(password, 10);

    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPass,
    });

    newUser.password = undefined;

    return res.status(201).json({
      success: true,
      message: "Registered successfuly",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (e) {
    console.log("register err : ", e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating user",
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const isPassVerified = await verifyPass(password, user.password);
    if (!isPassVerified) {
      return res.status(401).json({
        success: false,
        message: "Wrong credentials",
      });
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json({
        success: true,
        message: "Logged in successfuly",
        accessToken: accessToken,
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while loggin",
    });
  }
};

exports.refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token not found." });
    }

    const verified = verifyToken(refreshToken);

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(verified.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
      .json({
        success: true,
        message: "Token generated successfuly",
        accessToken: accessToken,
      });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating token.",
    });
  }
};

exports.logout = (req, res) => {
  return res
    .status(200)
    .clearCookie("refreshToken", refreshCookieOptions)
    .json({
      success: true,
      message: "logged out successfuly",
    });
};
