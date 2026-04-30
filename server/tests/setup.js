const mongoose = require("mongoose");
require("dotenv").config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});