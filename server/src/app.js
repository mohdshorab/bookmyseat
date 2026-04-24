const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const connectDB = require("./configs/db");
const eventRoutes = require("./routes/event.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/bookmyseat/auth", authRoutes);
app.use("/bookmyseat/event", eventRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

const runServer = async () => {
  await connectDB();
  app.listen(process.env.PORT);
};

runServer();
