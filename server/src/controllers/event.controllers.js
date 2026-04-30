const mongoose = require("mongoose");
const Event = require("../models/event.model");
const Seat = require("../models/seat.model");
const Booking = require("../models/booking.model");
const sendApiResponse = require("../utils/sendApiResponse");

exports.createEvent = async (req, res, next) => {
  const { title, description, date, venue, price, total_seats } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const eventResult = await Event.create(
      [
        {
          title,
          description,
          date,
          venue,
          price,
          total_seats,
          available_seats: total_seats,
          booked_seats: 0,
          createdBy: req.user._id,
          status: "active",
        },
      ],
      { session },
    );
    const event = eventResult[0];
    const seats = [];
    for (let i = 1; i <= total_seats; i++) {
      seats.push({
        seatNumber: i,
        eventId: event._id,
      });
    }
    await Seat.insertMany(seats, { session });
    await session.commitTransaction();
    return sendApiResponse({
      status: 201,
      message: "Event created successfully.",
      res,
      props: { event },
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    session.endSession();
  }
};

exports.deleteEvent = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const id = req.params.id;
    session.startTransaction();
    //Check if there are booked seats or not
    const bookedCount = await Seat.countDocuments({
      eventId: id,
      status: { $in: ["booked", "locked"] },
    });
    if (bookedCount > 0) {
      await session.abortTransaction();
      return sendApiResponse({
        status: 400,
        message: "Event cannot be deleted as it has booked/locked seats",
        res,
      });
    }
    // If not then del
    const result = await Event.findByIdAndDelete(id, { session });
    if (!result) {
      await session.abortTransaction();
      return sendApiResponse({ status: 404, message: "Event not found.", res });
    }

    await Seat.deleteMany({ eventId: id }, { session });

    await session.commitTransaction();

    return sendApiResponse({
      status: 200,
      message: "Event deleted successfully",
      res,
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    session.endSession();
  }
};

exports.updateEvent = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const id = req.params.id;

    const { title, description, venue, total_seats, price } = req.body;
    session.startTransaction();

    // check event exist
    const document = await Event.findById(id).lean().session(session);
    if (!document) {
      await session.abortTransaction();
      return sendApiResponse({ status: 404, message: "Event not found.", res });
    }

    // check if booked seats are more than new total seats
    const notAvailSeatCount = await Seat.countDocuments(
      {
        eventId: id,
        status: { $in: ["locked", "booked"] },
      },
      { session },
    );

    if (price !== document.price && notAvailSeatCount > 0) {
      await session.abortTransaction();
      return sendApiResponse(res, {
        status: 400,
        message:
          "Price cannot be modified because some seats are already booked or locked.",
      });
    }

    if (notAvailSeatCount > total_seats) {
      await session.abortTransaction();
      return sendApiResponse({
        status: 400,
        message: `Cannot reduce capacity. ${notAvailSeatCount} seats are currently booked or being held.`,
        res,
      });
    }

    // update event details
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          title,
          description,
          venue,
          total_seats,
          price,
          available_seats: total_seats ? total_seats - document.booked_seats : document.total_seats,
        },
      },
      { returnDocument: "after", session },
    );

    // if total_seats is updated calculate the difference
    const seatDiff = document.total_seats - total_seats;
    const seats = [];

    // if new total_seat is greater than old total_seat, add new seats
    if (seatDiff < 0) {
      for (let i = document.total_seats + 1; i <= total_seats; i++) {
        seats.push({
          seatNumber: i,
          eventId: id,
        });
      }
      await Seat.insertMany(seats, { session });
    }

    // if new total_seat is less than old total_seat, delete seats
    if (seatDiff > 0) {
      const allSeats = await Seat.find({
        eventId: id,
        status: "available",
      })
        .sort({ seatNumber: -1 })
        .limit(seatDiff)
        .select("_id")
        .session(session);

      const arrOfSeatIds = allSeats.map((seat) => seat._id);

      if (arrOfSeatIds.length > 0) {
        await Seat.deleteMany({ _id: { $in: arrOfSeatIds } }, { session });
      }
    }

    await session.commitTransaction();
    return sendApiResponse({
      status: 200,
      message: "Event updated successfully",
      res,
      props: { event: updatedEvent },
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    session.endSession();
  }
};

exports.allEvents = async (req, res, next) => {
  try {
    const allEves = await Event.find({}).lean();
    return sendApiResponse({
      status: 200,
      message:
        allEves.length > 0 ? "Events fetched successfully" : "No events found",
      res,
      props: { events: allEves },
    });
  } catch (e) {
    next(e);
  }
};

exports.singleEvent = async (req, res, next) => {
  try {
    const id = req.params.id;

    const event = await Event.findById(id).lean();
    if (!event) {
      return sendApiResponse({ status: 404, message: "Event not found.", res });
    }

    const seats = await Seat.find({ eventId: id }).lean();

    return sendApiResponse({
      status: 200,
      message: "Event details fetched",
      res,
      props: { event: { ...event, seats } },
    });
  } catch (e) {
    next(e);
  }
};

exports.cancelEvent = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req.params.id;

    const event = await Event.findById(id).session(session);
    if (!event) {
      await session.abortTransaction();
      return sendApiResponse({ status: 404, message: "Event not found.", res });
    }

    if (event.status === "cancelled") {
      await session.abortTransaction();
      return sendApiResponse({
        status: 400,
        message: "Event is already cancelled.",
        res,
      });
    }

    event.status = "cancelled";
    await event.save({ session });

    await Booking.updateMany(
      { eventId: id, status: { $in: ["confirmed", "pending"] } },
      { $set: { status: "cancelled" } },
      { session },
    );

    await Seat.updateMany(
      { eventId: id, status: "booked" },
      { $set: { status: "cancelled" } },
      { session },
    );

    await Seat.deleteMany(
      { eventId: id, status: { $in: ["available", "locked"] } },
      { session },
    );

    await session.commitTransaction();

    return sendApiResponse({
      status: 200,
      message: "Event cancelled successfully",
      res,
      props: { event },
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    session.endSession();
  }
};
