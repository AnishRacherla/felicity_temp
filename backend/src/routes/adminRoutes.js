import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

// All routes require authentication as admin
router.use(protect);
router.use(authorize(ROLES.ADMIN));

// System stats
router.get("/stats", adminController.getSystemStats);

// Organizer management
router.post("/organizers", adminController.createOrganizer);
router.get("/organizers", adminController.getAllOrganizers);
router.get("/organizers/:id", adminController.getOrganizerDetails);
router.put("/organizers/:id", adminController.updateOrganizer);
router.put("/organizers/:id/toggle", adminController.toggleOrganizerStatus);
router.delete("/organizers/:id", adminController.deleteOrganizer);
router.post("/organizers/:id/reset-password", adminController.resetOrganizerPassword);

// Password reset requests
router.get("/password-requests", adminController.getPasswordResetRequests);
router.post("/password-requests/:id/approve", adminController.approvePasswordResetRequest);
router.post("/password-requests/:id/reject", adminController.rejectPasswordResetRequest);

export default router;
