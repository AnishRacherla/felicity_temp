/**
 * FEEDBACK ROUTES
 * 
 * Anonymous feedback system
 */

import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Submit feedback (participant)
router.post('/:registrationId', feedbackController.submitFeedback);

// Check feedback status (participant)
router.get('/check/:registrationId', feedbackController.checkFeedbackStatus);

// Get event feedback (organizer)
router.get('/event/:eventId', feedbackController.getEventFeedback);

export default router;
