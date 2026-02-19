/**
 * DISCUSSION MODEL
 * 
 * Real-time discussion forum for events
 * Participants can post messages and replies
 */

import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const discussionSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  replies: [replySchema],
  isEdited: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
discussionSchema.index({ event: 1, createdAt: -1 });
discussionSchema.index({ event: 1, isPinned: -1, createdAt: -1 });

const Discussion = mongoose.model('Discussion', discussionSchema);

export default Discussion;
