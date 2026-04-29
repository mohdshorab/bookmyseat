const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    seats: {
      type: [String],
      ref: "Seat",
      required: true,
      max: 5,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "failed", "success"],
      default: "pending",
    },
    paymentId: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    }
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
