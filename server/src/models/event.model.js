const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title can't be empty"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total_seats: {
      type: Number,
      required: true,
      min: 1,
    },
    available_seats: {
      type: Number,
      required: true,
    },
    booked_seats: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Event", eventSchema);
