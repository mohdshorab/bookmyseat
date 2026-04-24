const User = require("../models/user.model");
const { getHashedPass, verifyPass } = require("../utils/hash");
const jwt = require("jsonwebtoken");

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
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret isn't defined");
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res
      .status(200)
      .res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "Logged in successfuly",
      });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while loggin",
    });
  }
};
