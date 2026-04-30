const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const { errorHandler } = require("./middlewares/error.middleware");
const bookingRoutes = require("./routes/booking.routes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/bookmyseat/auth", authRoutes);
app.use("/bookmyseat/event", eventRoutes);
app.use("/bookmyseat/booking", bookingRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

module.exports = app; 