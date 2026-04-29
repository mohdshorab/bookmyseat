const Event = require("../models/event.model");
const Booking = require("../models/booking.model");
const sendApiresponse = require("../utils/sendApiResponse");
const mongoose = require("mongoose");
const Seat = require("../models/seat.model");

exports.initiateBooking = async (req, res, next) => {
  const user = req.user;
  const { eventId, seats, venue, totalAmount } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const eventExistence = await Event.findById(eventId)
      .lean()
      .session(session);

    if (!eventExistence) {
      await session.abortTransaction();
      return sendApiresponse({ status: 404, message: "Event not found", res });
    }

    if (eventExistence.status === "cancelled") {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: "Event is cancelled",
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

    const availableSeatsCount = await Seat.countDocuments(
      {
        _id: { $in: seats },
        status: "available",
        eventId,
      },
      { session },
    );

    if (availableSeatsCount !== seats.length) {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: "One or more selected seats are no longer available.",
        res,
      });
    }
    const totalAmount = eventExistence.price * availableSeatsCount;

    const booking = await Booking.create(
      [
        {
          userId: user._id,
          eventId,
          venue,
          seats,
          totalAmount: totalAmount,
          status: "pending",
        },
      ],
      { session },
    );

    const lockSeats = await Seat.updateMany(
      { _id: { $in: seats }, status: "available", eventId },
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

    if (!booking) {
      await session.abortTransaction();
      return sendApiresponse({
        status: 404,
        message: "Booking not found",
        res,
      });
    }

    const event = await Event.findById(booking.eventId).lean().session(session);

    if (!event) {
      await session.abortTransaction();
      return sendApiresponse({ status: 404, message: "Event not found", res });
    }

    if (booking.status !== "pending") {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: "Booking is already confirmed or cancelled",
        res,
      });
    }

    if (booking.expiresAt < new Date()) {
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: "Booking has expired",
        res,
      });
    }

    if (paymentStatus === "failed") {
      booking.status = "failed";
      booking.paymentId = paymentId;
      booking.paymentMethod = paymentMethod;
      booking.expiresAt = null;
      await Seat.updateMany(
        { _id: { $in: booking.seats } },
        {
          $set: {
            status: "available",
            lockedBy: null,
            lockExpiresAt: null,
          },
        },
        { session },
      );
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

    if (!event) {
      await session.abortTransaction();
      return sendApiresponse({ status: 404, message: "Event not found", res });
    }

    if (booking.status === "cancelled") {
      let message = "";
      if (event.status === "cancelled") {
        message += "Event is cancelled";
      } else {
        message += "Booking is cancelled";
      }
      await session.abortTransaction();
      return sendApiresponse({
        status: 400,
        message: message,
        res,
      });
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

    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      {
        $set: {
          status: "available",
          bookedBy: null,
          lockedBy: null,
          lockExpiresAt: null,
        },
      },
      { session },
    );
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
