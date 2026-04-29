const { z } = require("zod");

const bookingSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, "Event ID is required"),
    seats: z
      .array(z.string())
      .min(1, "Seats are required")
      .max(5, "You can only book up to 5 seats per transaction."),
    venue: z.string().min(1, "Venue is required"),
    totalAmount: z.number().positive(),
  }),
});

module.exports = bookingSchema;
