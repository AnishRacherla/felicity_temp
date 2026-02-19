import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
import * as participantController from "../controllers/participantController.js";

const router = express.Router();

// All routes require authentication as participant
router.use(protect);
router.use(authorize(ROLES.PARTICIPANT));

// Profile management
router.get("/profile", participantController.getProfile);
router.put("/profile", participantController.updateProfile);
router.put("/preferences", participantController.setPreferences);

// Registrations
router.get("/registrations", participantController.getMyRegistrations);
router.get("/upcoming", participantController.getUpcomingEvents);

// Organizers
router.post("/follow/:organizerId", participantController.toggleFollowOrganizer);
router.get("/organizers", participantController.getOrganizers);
router.get("/organizers/:organizerId", participantController.getOrganizerDetails);

export default router;
