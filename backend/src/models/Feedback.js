/**
 * FEEDBACK MODEL
 * 
 * Anonymous feedback system for events
 * Participants can submit feedback after attending events
 */

import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
    unique: true // One feedback per registration
  },
  // Anonymous - no direct participant reference
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // Categories for feedback
  categories: {
    organization: { type: Number, min: 1, max: 5 },
    content: { type: Number, min: 1, max: 5 },
    venue: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 }
  },
  // Optional suggestions
  suggestions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Metadata (no identifying info)
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ event: 1, submittedAt: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
