import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
import * as organizerController from "../controllers/organizerController.js";

const router = express.Router();

// All routes require authentication as organizer
router.use(protect);
router.use(authorize(ROLES.ORGANIZER));

// Profile management
router.get("/profile", organizerController.getProfile);
router.put("/profile", organizerController.updateProfile);

// Password reset requests
router.post("/request-password-reset", organizerController.requestPasswordReset);
router.get("/password-requests", organizerController.getMyPasswordResetRequests);

// Dashboard
router.get("/dashboard", organizerController.getDashboard);

// Event management
router.get("/events", organizerController.getMyEvents);
router.get("/events/:id", organizerController.getEventDetails);
router.put("/events/:id", organizerController.updateEvent);
router.delete("/events/:id", organizerController.deleteEvent);

// Event status changes
router.post("/events/:id/publish", organizerController.publishEvent);
router.post("/events/:id/close", organizerController.closeEvent);
router.post("/events/:id/complete", organizerController.completeEvent);

// Registrations management
router.get("/events/:id/registrations", organizerController.getEventRegistrations);
router.get("/events/:id/export", organizerController.exportRegistrations);

// Merchandise payment approval
router.post("/registrations/:id/approve", organizerController.approveMerchandisePayment);
router.post("/registrations/:id/reject", organizerController.rejectMerchandisePayment);

// Ticket verification (QR scanning)
router.post("/verify-ticket", organizerController.verifyTicket);

export default router;
