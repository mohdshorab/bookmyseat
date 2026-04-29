const Event = require("../models/event.model");
const Booking = require("../models/booking.model");
const sendApiresponse = require("../utils/sendApiResponse");
const mongoose = require("mongoose");
const Seats = require("../models/seat.model");

exports.initiateBooking = async (req, res, next) => {
  const user = req.user;
  const { eventId, seats, venue, totalAmount } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const eventExistence = await Event.findById(eventId)
      .lean()
      .session(session);
    if (!eventExistence || eventExistence.status === "cancelled") {
      return sendApiresponse({ status: 400, message: "Event not found" });
    }
    if (eventExistence.available_seats < seats.length) {
      return sendApiresponse({
        status: 400,
        message: `Only ${eventExistence.available_seats} is available}.`,
      });
    }

    const availableSeatsCount = await Seats.countDocuments(
      {
        _id: { $in: seats },
        status: "available",
        eventId,
      },
      { session },
    );

    if (availableSeatsCount !== seats.length) {
      return sendApiresponse({
        status: 400,
        message: '"One or more selected seats are no longer available.',
      });
    }
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
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
          expiresAt: expirationTime,
        },
      ],
      { session },
    );

    const lockSeats = await Seats.updateMany(
      { _id: { $in: seats }, status: "available", eventId },
      {
        $set: {
          status: "locked",
          lockedBy: user._id,
          lockExpiresAt: Date.now() * 15 * 60 * 1000,
        },
      },
      { session },
    );

    if (lockSeats.modifiedCount !== seats.length) {
      throw new Error("Some seats were just taken by another user.");
    }

    await session.commitTransaction();
    return sendApiresponse({
      status: 200,
      message: "Bokking inititated successfully.",
      props: {
        booking: booking[0],
      },
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    await session.endSession();
  }
};