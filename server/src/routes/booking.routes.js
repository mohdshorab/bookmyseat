const express = require("express");
const bookingControllers = require("../controllers/booking.controllers");
const validate = require("../middlewares/validate");
const bookingSchema = require("../validators/booking.validators");
const { protect } = require("../middlewares/auth.middleware");

const bookingRoutes = express.Router();

bookingRoutes.get(
  "/",
  protect,
  validate(bookingSchema),
  bookingControllers.initiateBooking,
);

module.exports = bookingRoutes;
