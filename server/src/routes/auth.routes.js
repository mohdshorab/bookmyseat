const express = require("express");
const authControllers = require("../controllers/auth.controllers");
const validate = require("../middlewares/validate");
const { registerSchema } = require("../validators/auth.validators");

const authRoute = express.Router();

authRoute.post("/register", validate(registerSchema), authControllers.register);

module.exports = authRoute;
