const app = require('./src/app');
require("dotenv").config();
const connectDB = require("./src/configs/db");

const runServer = async () => {
  await connectDB();
  app.listen(process.env.PORT);
};

runServer();