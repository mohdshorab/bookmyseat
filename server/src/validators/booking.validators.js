const { z } = require("zod");

const bookingSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, "Event ID is required"),
    seats: z
      .array(z.string())
      .min(1, "Seats are required")
      .max(5, "You can only book up to 5 seats per transaction."),
  }),
});

const confirmBookingSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
    paymentMethod: z.string().min(1, "Payment Method is required"),
    paymentStatus: z.enum(["success", "failed"]),
  }),
});

module.exports = {
  bookingSchema,
  confirmBookingSchema,
};
