const Event = require("../models/event.model");

exports.createEvent = async (req, res) => {
  const { title, description, date, venue, price, total_seats } = req.body;
  try {
    const findEvent = await Event.findOne({ title: title });

    if (findEvent) {
      return res.status(409).json({
        success: false,
        message: "Event with this name is already existed",
      });
    }

    const event = await Event.create({
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
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: event,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating an event.",
    });
  }
};
