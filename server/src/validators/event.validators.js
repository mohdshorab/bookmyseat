const { z } = require("zod");

exports.eventSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Title is required" })
      .trim()
      .min(4, "Title must be at least 4 characters long"),
    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(20, "Description must be at least 20 characters long"),
    date: z.coerce
      .date({ required_error: "Event date is required" })
      .refine((d) => d > new Date(), {
        message: "Event date must be a future date",
      }),
    venue: z
      .string({ required_error: "Venue is required" })
      .trim()
      .min(6, "Venue name must be at least 6 characters long"),
    price: z
      .number({
        required_error: "Price is required",
        invalid_type_error: "Price must be a number",
      })
      .min(100, "Price must be at least 180 (Minimum ticket price)"),
    total_seats: z
      .number({ required_error: "Total seats is required" })
      .int("Seats must be a whole number")
      .min(10, "Minimum 10 seats are required to create an event")
      .max(50, "Capacity cannot exceed 50 seats")
  }),
});

exports.updateEventSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(4, "Title must be at least 4 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters")
      .optional(),
    date: z.coerce
      .date()
      .refine((d) => d > new Date(), {
        message: "Updated event date must be in the future",
      })
      .optional(),
    venue: z
      .string()
      .trim()
      .min(6, "Venue must be at least 6 characters")
      .optional(),
    price: z
      .number()
      .min(100, "Updated price cannot be less than 100")
      .optional(),
    status: z
      .enum(["active", "cancelled"], {
        errorMap: () => ({
          message: "Status must be either 'active' or 'cancelled'",
        }),
      })
      .optional(),
    total_seats: z
      .number()
      .int("Seats must be a whole number")
      .min(10, "Capacity cannot be reduced below 10 seats")
      .max(50, "Capacity cannot exceed 50 seats")
      .optional(),
  }),
});
