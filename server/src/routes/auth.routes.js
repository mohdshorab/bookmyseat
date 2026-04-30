const express = require("express");
const authControllers = require("../controllers/auth.controllers");
const validate = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
  adminSchema,
} = require("../validators/auth.validators");
const {
  checkForSuperAdmin,
  protect,
} = require("../middlewares/auth.middleware");

const authRoute = express.Router();

authRoute.post("/register", validate(registerSchema), authControllers.register);
authRoute.post("/login", validate(loginSchema), authControllers.login);
authRoute.post("/refresh-token", authControllers.refresh);
authRoute.post("/logout", authControllers.logout);
authRoute.post(
  "/create-admin",
  protect,
  checkForSuperAdmin,
  validate(adminSchema),
  authControllers.createAdmin,
);

module.exports = authRoute;
