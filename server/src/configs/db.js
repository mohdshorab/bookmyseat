const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("DB URI isn't defined");
    }
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
    });
    console.log("DB Connected");
  } catch (e) {
    console.log("DB Connection Failed", e);
    process.exit(1);
  }
};

module.exports = connectDB;
