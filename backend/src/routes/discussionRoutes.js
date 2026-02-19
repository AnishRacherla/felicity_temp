/**
 * DISCUSSION ROUTES
 * 
 * Real-time discussion forum for events
 */

import express from 'express';
import * as discussionController from '../controllers/discussionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all discussions for an event
router.get('/event/:eventId', discussionController.getEventDiscussions);

// Post new discussion message
router.post('/event/:eventId', discussionController.postDiscussion);

// Post reply to a discussion
router.post('/:discussionId/reply', discussionController.postReply);

// Toggle like on a discussion
router.put('/:discussionId/like', discussionController.toggleLike);

// Delete a discussion
router.delete('/:discussionId', discussionController.deleteDiscussion);

// Pin/unpin a discussion (organizer only)
router.put('/:discussionId/pin', discussionController.togglePin);

export default router;
