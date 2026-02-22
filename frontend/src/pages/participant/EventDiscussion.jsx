/**
 * EVENT DISCUSSION PAGE
 * 
 * Real-time discussion forum for registered participants
 * Features:
 * - View all messages
 * - Post new messages
 * - Reply to messages
 * - Like messages
 * - Auto-refresh (polling)
 * - Pinned messages
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionAPI, eventAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './EventDiscussion.css';

function EventDiscussion() {
  console.log('=== EventDiscussion Component Mounted ===');
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('EventId:', eventId);
  console.log('User:', user);
  
  // State
  const [event, setEvent] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [likingIds, setLikingIds] = useState(new Set());
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  /**
   * FETCH EVENT DETAILS
   */
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventAPI.getEventDetails(eventId);
        console.log('Event data:', response.data.event);
        console.log('Current user:', user);
        console.log('Event organizer:', response.data.event.organizer);
        setEvent(response.data.event);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details');
      }
    };

    fetchEvent();
  }, [eventId, user]);

  /**
   * FETCH DISCUSSIONS
   */
  const fetchDiscussions = async () => {
    try {
      const response = await discussionAPI.getEventDiscussions(eventId);
      console.log('Discussions response:', response.data);
      console.log('Number of discussions:', response.data.discussions?.length);
      console.log('Discussions array:', response.data.discussions);
      console.log('Backend isOrganizer:', response.data.isOrganizer);
      setDiscussions(response.data.discussions);
      setIsOrganizer(response.data.isOrganizer || false);
      setError('');
    } catch (err) {
      console.error('Error fetching discussions:', err);
      console.error('Error response:', err.response);
      if (err.response?.status === 403) {
        setError('⚠️ You must be registered for this event or be the organizer to view discussions');
      } else {
        setError(err.response?.data?.message || 'Failed to load discussions');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * INITIAL LOAD & POLLING
   */
  useEffect(() => {
    fetchDiscussions();

    // Mark as viewed and update notification count
    const updateNotificationCount = () => {
      const storageKey = user?.role === 'organizer' 
        ? `discussion_organizer_${eventId}_count` 
        : `discussion_${eventId}_count`;
      
      // Update the last seen count to current discussion count
      localStorage.setItem(storageKey, discussions.length.toString());
      console.log(`Updated ${storageKey} to ${discussions.length}`);
    };
    
    // Update notification count after discussions load
    if (discussions.length > 0) {
      setTimeout(() => {
        updateNotificationCount();
      }, 2000);
    }

    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchDiscussions();
    }, 5000);

    // Update count when leaving
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      updateNotificationCount();
    };
  }, [eventId, event, user, discussions.length]);

  /**
   * POST NEW MESSAGE
   */
  const handlePostMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    try {
      setPosting(true);
      await discussionAPI.postDiscussion(eventId, { 
        message: newMessage,
        isAnnouncement: isAnnouncement 
      });
      setNewMessage('');
      setIsAnnouncement(false);
      await fetchDiscussions();
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error posting message:', err);
      alert(err.response?.data?.message || 'Failed to post message');
    } finally {
      setPosting(false);
    }
  };

  /**
   * POST REPLY
   */
  const handlePostReply = async (discussionId) => {
    if (!replyMessage.trim()) {
      return;
    }

    try {
      await discussionAPI.postReply(discussionId, { message: replyMessage });
      setReplyMessage('');
      setReplyingTo(null);
      await fetchDiscussions();
    } catch (err) {
      console.error('Error posting reply:', err);
      alert(err.response?.data?.message || 'Failed to post reply');
    }
  };

  /**
   * TOGGLE LIKE
   */
  const handleToggleLike = async (discussionId) => {
    if (likingIds.has(discussionId)) return;

    try {
      setLikingIds(prev => new Set([...prev, discussionId]));
      await discussionAPI.toggleLike(discussionId);
      await fetchDiscussions();
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLikingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(discussionId);
        return newSet;
      });
    }
  };

  /**
   * DELETE MESSAGE
   */
  const handleDeleteMessage = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await discussionAPI.deleteDiscussion(discussionId);
      await fetchDiscussions();
    } catch (err) {
      console.error('Error deleting message:', err);
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  /**
   * TOGGLE PIN MESSAGE (ORGANIZER ONLY)
   */
  const handleTogglePin = async (discussionId, currentPinState) => {
    try {
      await discussionAPI.togglePin(discussionId);
      await fetchDiscussions();
    } catch (err) {
      console.error('Error toggling pin:', err);
      alert(err.response?.data?.message || 'Failed to toggle pin');
    }
  };

  // isOrganizer is now set from backend response in fetchDiscussions
  console.log('isOrganizer state:', isOrganizer);
  console.log('Current user:', user?.id);  // Fixed: user.id not user._id
  console.log('Event organizer:', event?.organizer);

  /**
   * FORMAT TIME
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    console.log('Rendering loading state...');
    return (
      <div className="event-discussion loading" style={{ background: '#f9fafb', minHeight: '100vh', padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#1f2937' }}>Loading discussion...</h2>
        <p style={{ color: '#6b7280' }}>EventID: {eventId}</p>
      </div>
    );
  }

  console.log('Rendering main discussion page...');
  console.log('Event:', event);
  console.log('Discussions count:', discussions.length);
  console.log('Error:', error);

  return (
    <div className="event-discussion">
      {/* Header */}
      <div className="discussion-header">
        <button onClick={() => navigate(`/events/${eventId}`)} className="back-button">
          ← Back to Event
        </button>
        <h1>💬 Event Discussion</h1>
        {event && <p className="event-name">{event.eventName}</p>}
        <p className="discussion-count">
          {discussions.length} message{discussions.length !== 1 ? 's' : ''}
          {isOrganizer && <span className="moderator-badge"> • You are moderating</span>}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => navigate(`/events/${eventId}`)} className="btn-back">
            Back to Event
          </button>
        </div>
      )}

      {/* Messages List */}
      {!error && (
        <>
          <div className="messages-container">
            {discussions.length === 0 ? (
              <div className="no-messages">
                <p>💬 No messages yet. Be the first to start a conversation!</p>
              </div>
            ) : (
              <div className="messages-list">
                {discussions.map((discussion) => {
                  console.log('Rendering discussion:', discussion._id, discussion.message);
                  console.log('isOrganizer for this render:', isOrganizer);
                  console.log('User ID:', user?.id);  // Fixed: user.id not user._id
                  console.log('Discussion participant ID:', discussion.participant._id);
                  const userOwnsMessage = discussion.participant._id?.toString() === user?.id?.toString();
                  console.log('User owns message:', userOwnsMessage);
                  console.log('Should show delete button:', (userOwnsMessage || isOrganizer));
                  return (
                  <div 
                    key={discussion._id} 
                    className={`message-card ${discussion.isPinned ? 'pinned' : ''} ${discussion.isAnnouncement ? 'announcement' : ''}`}
                  >
                    {discussion.isAnnouncement && (
                      <div className="announcement-badge">📢 Announcement</div>
                    )}
                    {discussion.isPinned && !discussion.isAnnouncement && (
                      <div className="pinned-badge">📌 Pinned</div>
                    )}

                    {/* Message Header */}
                    <div className="message-header">
                      <div className="author-info">
                        <span className="author-name">
                          {discussion.participant.firstName} {discussion.participant.lastName}
                          {event && (() => {
                            const organizerId = typeof event.organizer === 'object' 
                              ? event.organizer?._id 
                              : event.organizer;
                            return discussion.participant._id === organizerId;
                          })() && (
                            <span className="organizer-badge">👤 Organizer</span>
                          )}
                        </span>
                        <span className="message-time">{formatTime(discussion.createdAt)}</span>
                      </div>
                      
                      {/* Moderation buttons */}
                      <div className="message-actions-header">
                        {/* Pin/Unpin button for organizer */}
                        {isOrganizer && (
                          <button 
                            onClick={() => handleTogglePin(discussion._id, discussion.isPinned)}
                            className="pin-btn"
                            title={discussion.isPinned ? 'Unpin message' : 'Pin message'}
                          >
                            {discussion.isPinned ? '📌 Unpin' : '📍 Pin'}
                          </button>
                        )}
                        
                        {/* Delete button for own messages or organizer */}
                        {(discussion.participant._id?.toString() === user?.id?.toString() || isOrganizer) && (
                          <button 
                            onClick={() => handleDeleteMessage(discussion._id)}
                            className="delete-btn"
                            title="Delete message"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="message-content">
                      <p>{discussion.message}</p>
                    </div>

                    {/* Message Actions */}
                    <div className="message-actions">
                      <button 
                        onClick={() => handleToggleLike(discussion._id)}
                        className={`like-btn ${discussion.likes.includes(user?.id) ? 'liked' : ''}`}
                        disabled={likingIds.has(discussion._id)}
                      >
                        ❤️ {discussion.likes.length}
                      </button>
                      
                      <button 
                        onClick={() => setReplyingTo(replyingTo === discussion._id ? null : discussion._id)}
                        className="reply-btn"
                      >
                        💬 Reply {discussion.replies.length > 0 && `(${discussion.replies.length})`}
                      </button>
                    </div>

                    {/* Replies */}
                    {discussion.replies.length > 0 && (
                      <div className="replies-list">
                        {discussion.replies.map((reply, index) => (
                          <div key={index} className="reply-card">
                            <div className="reply-header">
                              <span className="reply-author">
                                {reply.participant.firstName} {reply.participant.lastName}
                              </span>
                              <span className="reply-time">{formatTime(reply.createdAt)}</span>
                            </div>
                            <p className="reply-content">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyingTo === discussion._id && (
                      <div className="reply-input-container">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Write a reply..."
                          maxLength={500}
                          rows={2}
                        />
                        <div className="reply-actions">
                          <button 
                            onClick={() => handlePostReply(discussion._id)}
                            disabled={!replyMessage.trim()}
                            className="post-reply-btn"
                          >
                            Post Reply
                          </button>
                          <button 
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyMessage('');
                            }}
                            className="cancel-reply-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* New Message Input */}
          <div className="new-message-container">
            <form onSubmit={handlePostMessage} className="new-message-form">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share your thoughts about this event..."
                maxLength={1000}
                rows={3}
                disabled={posting}
              />
              <div className="form-footer">
                <div className="form-options">
                  {isOrganizer && (
                    <label className="announcement-checkbox">
                      <input 
                        type="checkbox" 
                        checked={isAnnouncement}
                        onChange={(e) => setIsAnnouncement(e.target.checked)}
                        disabled={posting}
                      />
                      <span>📢 Post as Announcement</span>
                    </label>
                  )}
                  <span className="char-count">{newMessage.length}/1000</span>
                </div>
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || posting}
                  className="post-btn"
                >
                  {posting ? 'Posting...' : isAnnouncement ? '📢 Post Announcement' : '📤 Post Message'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default EventDiscussion;
