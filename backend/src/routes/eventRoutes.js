import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
import * as eventController from "../controllers/eventController.js";
import * as registrationController from "../controllers/registrationController.js";

const router = express.Router();

// Public/Authenticated event browsing
router.get("/", eventController.browseEvents);
router.get("/trending", eventController.getTrendingEvents);
router.get("/:id", eventController.getEventDetails);

// Protected routes - Event creation (Organizer only)
router.post("/", protect, authorize(ROLES.ORGANIZER), eventController.createEvent);

// Protected routes - Event registration (Participant only)
router.post(
  "/:eventId/register",
  protect,
  authorize(ROLES.PARTICIPANT),
  registrationController.registerForEvent
);
router.post(
  "/:eventId/purchase",
  protect,
  authorize(ROLES.PARTICIPANT),
  registrationController.purchaseMerchandise
);

// Registration management (Participant only)
router.get(
  "/registrations/:registrationId",
  protect,
  authorize(ROLES.PARTICIPANT),
  registrationController.getTicketDetails
);
router.post(
  "/registrations/:registrationId/payment-proof",
  protect,
  authorize(ROLES.PARTICIPANT),
  registrationController.uploadPaymentProof
);
router.delete(
  "/registrations/:registrationId",
  protect,
  authorize(ROLES.PARTICIPANT),
  registrationController.cancelRegistration
);

export default router;
