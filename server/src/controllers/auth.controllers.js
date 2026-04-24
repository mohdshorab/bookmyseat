const User = require("../models/user.model");
const { getHashedPass } = require("../utils/hash");

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
