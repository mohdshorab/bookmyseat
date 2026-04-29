const Seat = require("../models/seat.model");

exports.releaseTheSeats = async (seats, session = null) => {
  return Seat.updateMany(
    { _id: { $in: seats } },
    {
      $set: {
        status: "available",
        lockedBy: null,
        lockExpiresAt: null,
      },
    },
    { session },
  );
};
