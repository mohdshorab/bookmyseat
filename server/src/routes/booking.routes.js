const express = require("express");
const bookingControllers = require("../controllers/booking.controllers");
const validate = require("../middlewares/validate");
const {
  bookingSchema,
  confirmBookingSchema,
} = require("../validators/booking.validators");
const { protect, checkForUser } = require("../middlewares/auth.middleware");
const { isBookingOwner } = require("../middlewares/booking.middleware");

const bookingRoutes = express.Router();

bookingRoutes.post(
  "/initiate",
  protect,
  checkForUser,
  validate(bookingSchema),
  bookingControllers.initiateBooking,
);
bookingRoutes.post(
  "/confirm/:bookingId",
  protect,
  checkForUser,
  isBookingOwner,
  validate(confirmBookingSchema),
  bookingControllers.confirmBooking,
);
bookingRoutes.post(
  "/cancel/:bookingId",
  protect,
  checkForUser,
  isBookingOwner,
  bookingControllers.cancelBooking,
);
bookingRoutes.get("/", protect, bookingControllers.getMyBooking);
module.exports = bookingRoutes;
