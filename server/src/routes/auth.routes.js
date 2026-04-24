const express = require("express");
const authControllers = require("../controllers/auth.controllers");
const validate = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
} = require("../validators/auth.validators");

const authRoute = express.Router();

authRoute.post("/register", validate(registerSchema), authControllers.register);
authRoute.post("/login", validate(loginSchema), authControllers.login);
authRoute.post("/refresh-token", authControllers.refresh);
authRoute.post("/logout", authControllers.logout);

module.exports = authRoute;