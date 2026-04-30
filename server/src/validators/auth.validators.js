const { z } = require("zod");

exports.registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(4, "Username must be at least 4 characters long"),

    email: z.string().trim().email("Please enter a valid email address"),

    password: z.string().min(8, "Password must be at least 8 characters long"),
  }),
});

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  }),
});

exports.adminSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Username is required" })
      .trim()
      .min(4, "Username must be at least 4 characters long"),

    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Please enter a valid email address"),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters long"),

    role: z.literal("admin", "Invalid role."),
  }),
});
