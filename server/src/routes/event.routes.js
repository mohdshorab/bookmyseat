const express = require("express");
const eventControllers = require("../controllers/event.controllers");
const validate = require("../middlewares/validate");
const { eventSchema, updateEventSchema } = require("../validators/event.validators");
const { protect, checkForAdmin } = require("../middlewares/auth.middleware");

const eventRoutes = express.Router();

// Protected for Admins
eventRoutes.post("/", protect, checkForAdmin, validate(eventSchema), eventControllers.createEvent);
eventRoutes.delete("/:id", protect, checkForAdmin, eventControllers.deleteEvent);
eventRoutes.patch('/:id', protect, checkForAdmin, validate(updateEventSchema), eventControllers.updateEvent)

// Universal
eventRoutes.get("/", eventControllers.allEvents);
eventRoutes.get("/:id", eventControllers.singleEvent);

module.exports = eventRoutes;
