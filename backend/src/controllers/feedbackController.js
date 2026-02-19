/**
 * FEEDBACK CONTROLLER
 * 
 * Anonymous feedback system for events
 * Participants submit feedback after attending
 * Organizers view aggregated feedback
 */

import Feedback from '../models/Feedback.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

/**
 * SUBMIT FEEDBACK (PARTICIPANT)
 * Route: POST /api/feedback/:registrationId
 */
export const submitFeedback = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { rating, feedback, categories, suggestions } = req.body;

    // Validate required fields
    if (!rating || !feedback) {
      return res.status(400).json({ message: 'Rating and feedback are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find registration
    const registration = await Registration.findById(registrationId)
      .populate('event', 'organizer eventName');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify ownership
    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if attended
    if (!registration.attended) {
      return res.status(400).json({ 
        message: 'You can only submit feedback for events you have attended' 
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ registration: registrationId });
    if (existingFeedback) {
      return res.status(400).json({ 
        message: 'You have already submitted feedback for this event' 
      });
    }

    // Create feedback
    const newFeedback = await Feedback.create({
      event: registration.event._id,
      registration: registrationId,
      rating,
      feedback: feedback.trim(),
      categories: categories || {},
      suggestions: suggestions ? suggestions.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      feedback: {
        rating: newFeedback.rating,
        submittedAt: newFeedback.submittedAt
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

/**
 * GET EVENT FEEDBACK (ORGANIZER)
 * Route: GET /api/feedback/event/:eventId
 */
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log('=== GET EVENT FEEDBACK ===');
    console.log('eventId:', eventId);
    console.log('user._id:', req.user._id);
    console.log('user role:', req.user.role);

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.error('Event not found:', eventId);
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    console.log('Event found:', event.eventName);
    console.log('Event organizer:', event.organizer.toString());
    console.log('Requesting user:', req.user._id.toString());
    console.log('Match:', event.organizer.toString() === req.user._id.toString());

    // Check if user is organizer of this event
    if (event.organizer.toString() !== req.user._id.toString()) {
      console.error('Unauthorized access - user is not organizer of this event');
      return res.status(403).json({ 
        success: false,
        message: 'Only the event organizer can view feedback' 
      });
    }

    // Get all feedback (anonymous)
    const feedbacks = await Feedback.find({ event: eventId })
      .select('-registration') // Don't expose registration ID
      .sort({ submittedAt: -1 });

    console.log('Feedbacks found:', feedbacks.length);

    // Calculate statistics
    const stats = {
      totalFeedbacks: feedbacks.length,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryAverages: {
        organization: 0,
        contentQuality: 0,
        venue: 0,
        overallExperience: 0
      }
    };

    if (feedbacks.length > 0) {
      // Average rating
      stats.averageRating = (
        feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      ).toFixed(2);

      // Rating distribution
      feedbacks.forEach(f => {
        stats.ratingDistribution[f.rating]++;
      });

      // Category averages
      const categoryCounts = { organization: 0, contentQuality: 0, venue: 0, overallExperience: 0 };
      feedbacks.forEach(f => {
        if (f.categories) {
          // Map old keys to new keys for backward compatibility
          const categoryMap = {
            organization: 'organization',
            content: 'contentQuality',
            contentQuality: 'contentQuality',
            venue: 'venue',
            overall: 'overallExperience',
            overallExperience: 'overallExperience'
          };
          
          Object.keys(f.categories).forEach(key => {
            const mappedKey = categoryMap[key];
            if (mappedKey && f.categories[key]) {
              stats.categoryAverages[mappedKey] += f.categories[key];
              categoryCounts[mappedKey]++;
            }
          });
        }
      });

      // Calculate averages
      Object.keys(categoryCounts).forEach(key => {
        if (categoryCounts[key] > 0) {
          stats.categoryAverages[key] = (
            stats.categoryAverages[key] / categoryCounts[key]
          ).toFixed(2);
        }
      });
    }

    const responseData = {
      success: true,
      stats,
      feedbacks: feedbacks.map(f => ({
        _id: f._id,
        rating: f.rating,
        feedback: f.feedback,
        categories: f.categories,
        suggestions: f.suggestions,
        submittedAt: f.submittedAt
      }))
    };

    console.log('Sending response with stats:', stats);
    console.log('Number of feedbacks in response:', responseData.feedbacks.length);

    res.json(responseData);
  } catch (error) {
    console.error('=== ERROR IN GET EVENT FEEDBACK ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch feedback', 
      error: error.message 
    });
  }
};

/**
 * CHECK IF FEEDBACK SUBMITTED (PARTICIPANT)
 * Route: GET /api/feedback/check/:registrationId
 */
export const checkFeedbackStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Find registration
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify ownership
    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check feedback
    const feedback = await Feedback.findOne({ registration: registrationId });

    res.json({
      success: true,
      hasSubmitted: !!feedback,
      canSubmit: registration.attended && !feedback
    });
  } catch (error) {
    console.error('Error checking feedback status:', error);
    res.status(500).json({ message: 'Failed to check feedback status' });
  }
};
