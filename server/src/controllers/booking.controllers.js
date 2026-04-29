const Event = require("../models/event.model");
const Booking = require("../models/booking.model");
const sendApiresponse = require("../utils/sendApiResponse");
const mongoose = require("mongoose");
const Seat = require("../models/seat.model");
const { releaseTheSeats } = require("../utils/seatUtils");

exports.initiateBooking = async (req, res, next) => {
  const user = req.user;
  const { eventId, seats, venue } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const eventExistence = await Event.findById(eventId)
      .lean()
      .session(session);

    if (!eventExistence || eventExistence.status === "cancelled") {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: "Event unavailable",
        res,
      });
    }

    if (eventExistence.available_seats < seats.length) {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: `Only ${eventExistence.available_seats} is available}.`,
        res,
      });
    }

    const lockSeats = await Seat.updateMany(
      {
        _id: { $in: seats },
        $or: [
          { status: "available" },
          { status: "locked", lockExpiresAt: { $lt: new Date() } },
        ],
        eventId,
      },
      {
        $set: {
          status: "locked",
          lockedBy: user._id,
          lockExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      },
      { session },
    );

    if (lockSeats.modifiedCount !== seats.length) {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: "One or more selected seats are no longer available.",
        res,
      });
    }
    const totalAmount = eventExistence.price * seats.length;

    const booking = await Booking.create(
      [
        {
          userId: user._id,
          eventId,
          seats,
          totalAmount,
          status: "pending",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return sendApiresponse({
      status: 200,
      message: "Booking initiated successfully.",
      props: {
        booking: booking[0],
      },
      res,
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    await session.endSession();
  }
};

exports.confirmBooking = async (req, res) => {
  const user = req.user;
  const { paymentId, paymentMethod, paymentStatus } = req.body;
  const { bookingId } = req.params;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const booking = await Booking.findById(bookingId).session(session);

    const event = await Event.findById(booking.eventId).lean().session(session);

    if (!event) {
      await session.abortTransaction();
      return sendApiresponse({ status: 404, message: "Event not found", res });
    }

    if (booking.status !== "pending") {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: `Booking is already ${booking.status}.`,
        res,
      });
    }

    if (booking.expiresAt < new Date()) {
      await releaseTheSeats(booking.seats, session);

      booking.status = "expired";
      await booking.save({ session });

      await session.commitTransaction();
      return sendApiresponse({
        status: 400,
        message: "Your booking session has expired. Please try again.",
        res,
      });
    }

    if (paymentStatus === "failed") {
      booking.status = "failed";
      booking.paymentId = paymentId;
      booking.paymentMethod = paymentMethod;
      booking.expiresAt = null;
      await releaseTheSeats(booking.seats, session);
    }

    if (paymentStatus === "success") {
      booking.status = "confirmed";
      booking.paymentId = paymentId;
      booking.paymentMethod = paymentMethod;
      booking.expiresAt = null;
      await Seat.updateMany(
        { _id: { $in: booking.seats } },
        {
          $set: {
            status: "booked",
            lockedBy: null,
            lockExpiresAt: null,
            bookedBy: user._id,
          },
        },
        { session },
      );
      await Event.findByIdAndUpdate(
        booking.eventId,
        {
          $inc: {
            available_seats: -booking.seats.length,
            booked_seats: booking.seats.length,
          },
        },
        { session },
      );
    }

    await booking.save({ session });
    await session.commitTransaction();
    return sendApiresponse({
      status: 200,
      message: "Booking confirmed successfully",
      res,
      props: { booking },
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    await session.endSession();
  }
};

exports.cancelBooking = async (req, res, next) => {
  const { bookingId } = req.params;
  const user = req.user;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return sendApiresponse({
        status: 404,
        message: "Booking not found",
        res,
      });
    }

    const event = await Event.findById(booking.eventId).lean().session(session);

    if (!event || event.status === 'cancelled') {
      await session.abortTransaction();
      return sendApiresponse({ status: 404, message: "Event not found", res });
    }

    if (booking.status === "pending") {
      booking.expiresAt = null;
    }

    if (booking.status === "confirmed") {
      await Event.findByIdAndUpdate(
        booking.eventId,
        {
          $inc: {
            available_seats: booking.seats.length,
            booked_seats: -booking.seats.length,
          },
        },
        { session },
      );
    }
    booking.status = "cancelled";
    await releaseTheSeats(booking.seats, session);

    await booking.save({ session });
    await session.commitTransaction();

    return sendApiresponse({
      status: 200,
      message: "Booking cancelled successfully",
      res,
      props: { booking },
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    await session.endSession();
  }
};

exports.getMyBooking = async (req, res, next) => {
  const user = req.user;
  try {
    const bookings = await Booking.find({ userId: user._id }).sort({
      createdAt: -1,
    });
    if (!bookings) {
      return sendApiresponse({ status: 404, message: "No booking found", res });
    }
    return sendApiresponse({
      status: 200,
      message: "Bookings fetched successfully",
      res,
      props: {
        bookings,
      },
    });
  } catch (e) {
    next(e);
  }
};
