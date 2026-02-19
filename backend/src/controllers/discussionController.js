/**
 * DISCUSSION CONTROLLER
 * 
 * Real-time discussion forum for events
 * Handles posting messages, replies, likes
 */

import Discussion from '../models/Discussion.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

/**
 * GET DISCUSSION MESSAGES FOR AN EVENT
 * Route: GET /api/discussions/event/:eventId
 */
export const getEventDiscussions = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer of this event
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    // If not organizer, check if registered as participant
    if (!isOrganizer && req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: eventId,
        participant: req.user._id,
        status: 'CONFIRMED'
      });

      if (!registration) {
        return res.status(403).json({ 
          message: 'You must be registered for this event to view discussions' 
        });
      }
    }

    // Get all discussions for this event
    const discussions = await Discussion.find({ event: eventId })
      .populate('participant', 'firstName lastName email')
      .populate('replies.participant', 'firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      discussions,
      count: discussions.length,
      isOrganizer
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Failed to fetch discussions' });
  }
};

/**
 * POST NEW DISCUSSION MESSAGE
 * Route: POST /api/discussions/event/:eventId
 */
export const postDiscussion = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ message: 'Message too long (max 1000 characters)' });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer of this event
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    // Verify user is registered for this event (participants only, organizers can post)
    if (!isOrganizer && req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: eventId,
        participant: req.user._id,
        status: 'CONFIRMED'
      });

      if (!registration) {
        return res.status(403).json({ 
          message: 'You must be registered for this event to participate in discussions' 
        });
      }
    }

    // Create discussion
    const discussion = await Discussion.create({
      event: eventId,
      participant: req.user._id,
      message: message.trim()
    });

    // Populate and return
    await discussion.populate('participant', 'firstName lastName email');

    res.status(201).json({
      success: true,
      discussion,
      message: 'Message posted successfully'
    });
  } catch (error) {
    console.error('Error posting discussion:', error);
    res.status(500).json({ message: 'Failed to post message' });
  }
};

/**
 * POST REPLY TO A DISCUSSION
 * Route: POST /api/discussions/:discussionId/reply
 */
export const postReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { message } = req.body;

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Reply cannot be empty' });
    }

    if (message.length > 500) {
      return res.status(400).json({ message: 'Reply too long (max 500 characters)' });
    }

    // Find discussion
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Get event to check if user is organizer
    const event = await Event.findById(discussion.event);
    const isOrganizer = event && event.organizer.toString() === req.user._id.toString();

    // Verify user is registered for this event (or is organizer)
    if (!isOrganizer && req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: discussion.event,
        participant: req.user._id,
        status: 'CONFIRMED'
      });

      if (!registration) {
        return res.status(403).json({ 
          message: 'You must be registered for this event to reply' 
        });
      }
    }

    // Add reply
    discussion.replies.push({
      participant: req.user._id,
      message: message.trim()
    });

    await discussion.save();
    await discussion.populate('replies.participant', 'firstName lastName');

    res.json({
      success: true,
      discussion,
      message: 'Reply posted successfully'
    });
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({ message: 'Failed to post reply' });
  }
};

/**
 * TOGGLE LIKE ON A DISCUSSION
 * Route: PUT /api/discussions/:discussionId/like
 */
export const toggleLike = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Get event to check if user is organizer
    const event = await Event.findById(discussion.event);
    const isOrganizer = event && event.organizer.toString() === req.user._id.toString();

    // Verify user is registered for this event (or is organizer)
    if (!isOrganizer && req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: discussion.event,
        participant: req.user._id,
        status: 'CONFIRMED'
      });

      if (!registration) {
        return res.status(403).json({ 
          message: 'You must be registered for this event to like messages' 
        });
      }
    }

    // Toggle like
    const likeIndex = discussion.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      // Unlike
      discussion.likes.splice(likeIndex, 1);
    } else {
      // Like
      discussion.likes.push(req.user._id);
    }

    await discussion.save();

    res.json({
      success: true,
      likes: discussion.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
};

/**
 * DELETE A DISCUSSION MESSAGE
 * Route: DELETE /api/discussions/:discussionId
 */
export const deleteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check authorization: owner or event organizer
    const event = await Event.findById(discussion.event);
    const isOwner = discussion.participant.toString() === req.user._id.toString();
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    if (!isOwner && !isOrganizer) {
      return res.status(403).json({ 
        message: 'You can only delete your own messages or messages in your events' 
      });
    }

    await Discussion.findByIdAndDelete(discussionId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

/**
 * PIN/UNPIN A DISCUSSION (ORGANIZER ONLY)
 * Route: PUT /api/discussions/:discussionId/pin
 */
export const togglePin = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Verify user is the event organizer
    const event = await Event.findById(discussion.event);
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Only the event organizer can pin messages' 
      });
    }

    // Toggle pin
    discussion.isPinned = !discussion.isPinned;
    await discussion.save();

    res.json({
      success: true,
      isPinned: discussion.isPinned,
      message: discussion.isPinned ? 'Message pinned' : 'Message unpinned'
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ message: 'Failed to toggle pin' });
  }
};
