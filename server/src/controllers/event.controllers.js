const mongoose = require("mongoose");
const Event = require("../models/event.model");
const Seat = require("../models/seat.model");
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
    session.abortTransaction();
    next(e);
  } finally {
    session.endSession();
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const id = req.params.id;

    const result = await Event.findByIdAndDelete(id);
    if (!result) {
      return sendApiResponse({ status: 404, message: "Event not found.", res });
    }
    return sendApiResponse({
      status: 200,
      message: "Event deleted successfully",
      res,
    });
  } catch (e) {
    next(e);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const id = req.params.id;

    const { title, description, venue, status, total_seats } = req.body;

    const filter = { _id: id };

    if (total_seats !== undefined) {
      filter.$expr = { $gte: [total_seats, "$booked_seats"] };
    }
    const newObject = { title, description, venue, status, total_seats };
    const updatedEve = await Event.findOneAndUpdate(
      filter,
      {
        $set: newObject,
      },
      { returnDocument: "after" },
    );

    if (!updatedEve) {
      return sendApiResponse({
        status: 400,
        message: "Event not found or Total Seats cannot be less than booked.",
        res,
      });
    }

    return sendApiResponse({
      status: 200,
      message: "Event updated successfully",
      res,
      props: { event: updatedEve },
    });
  } catch (e) {
    next(e);
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

    return sendApiResponse({
      status: 200,
      message: "Event details fetched",
      res,
      props: { event },
    });
  } catch (e) {
    next(e);
  }
};
