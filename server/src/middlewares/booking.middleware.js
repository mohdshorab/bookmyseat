const Booking = require("../models/booking.model");
const sendApiResponse = require("../utils/sendApiResponse");

exports.isBookingOwner = async (req, res, next) => {
  const user = req.user;
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).select("userId status");
    if (!booking) {
      return sendApiResponse({
        status: 400,
        message: "Booking not found.",
        res,
      });
    }

    if (booking.userId.toString() !== user._id.toString()) {
      return sendApiResponse({ status: 400, message: "Unauthorized.", res });
    }

    if (booking.status === "cancelled") {
      return sendApiResponse({
        status: 400,
        message: "Booking is already cancelled.",
        res,
      });
    }

    next();
  } catch (e) {
    next(e);
  }
};
