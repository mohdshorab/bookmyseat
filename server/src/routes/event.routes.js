const express = require("express");
const eventControllers = require("../controllers/event.controllers");
const validate = require("../middlewares/validate");
const { eventSchema } = require("../validators/event.validators");
const { protect, checkRole } = require("../middlewares/auth.middleware");

const eventRoutes = express.Router();

eventRoutes.post(
  "/create-event",
  protect,
  checkRole,
  validate(eventSchema),
  eventControllers.createEvent,
);

module.exports = eventRoutes;
