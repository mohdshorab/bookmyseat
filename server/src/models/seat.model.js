const mongoose = require("mongoose");

const seatSchema = mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Seat", seatSchema);
