const Booking = require("../models/booking.model");
const sendApiResponse = require("../utils/sendApiResponse");

exports.isBookingOwner = async (req, res, next) => {
  const user = req.user;
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return sendApiResponse({ status: 400, message: "Booking not found.",res });
    }
    if (booking.userId.toString() !== user._id.toString()) {
      return sendApiResponse({ status: 400, message: "Unauthorized.",res });
    }
    next();
  } catch (e) {
    next(e);
  }
};
