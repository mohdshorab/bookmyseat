const mongoose = require("mongoose");

const User = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username can't be empty"],
    },
    email: {
      type: String,
      required: [true, "Email can't be empty"],
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: { type: String, required: [true, "Password can't be empty"] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", User);
