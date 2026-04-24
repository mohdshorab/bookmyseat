const { z } = require("zod");

exports.eventSchema = z.object({
  body: z.object({
    title: z.string().trim().min(4, "Title must be at least 4 characters"),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters"),
    date: z.coerce.date().refine((d) => d > new Date(), {
      message: "Event date must be in the future",
    }),
    venue: z.string().trim().min(6, "Venue name must be at least 6 characters"),
    price: z.number().min(100, "Price must be at least 100"),
    total_seats: z.number().int().min(10, "Minimum 10 seats required"),
  }),
});
