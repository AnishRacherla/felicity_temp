import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feedbackAPI, eventAPI } from '../../services/api';
import './EventFeedback.css';

function EventFeedback() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('EventFeedback - eventId from useParams:', eventId);
    if (eventId) {
      fetchEventAndFeedback();
    } else {
      console.error('EventFeedback - eventId is undefined!');
      setError('Event ID not found');
      setLoading(false);
    }
  }, [eventId]);

  const fetchEventAndFeedback = async () => {
    try {
      setLoading(true);
      console.log('Fetching event and feedback for eventId:', eventId);
      const [eventResponse, feedbackResponse] = await Promise.all([
        eventAPI.getEventDetails(eventId),
        feedbackAPI.getEventFeedback(eventId)
      ]);
      console.log('Event response:', eventResponse.data);
      console.log('Feedback response:', feedbackResponse.data);
      setEvent(eventResponse.data.event);
      setFeedbackData(feedbackResponse.data);
    } catch (err) {
      console.error('Fetch event/feedback error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`star-display ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  const renderDistributionBar = (count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="distribution-bar">
        <div className="distribution-fill" style={{ width: `${percentage}%` }}></div>
        <span className="distribution-count">{count}</span>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading feedback...</div>;
  }

  if (error) {
    return (
      <div className="error-container" style={{
        padding: '40px',
        maxWidth: '600px',
        margin: '40px auto',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#991b1b', marginBottom: '10px' }}>Error Loading Feedback</h3>
          <p className="error-message" style={{ color: '#7f1d1d', marginBottom: '0' }}>{error}</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="btn-back"
          style={{
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Go Back
        </button>
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f3f4f6', 
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6b7280',
          textAlign: 'left'
        }}>
          <strong>Debug Info:</strong>
          <div>Event ID: {eventId}</div>
          <div>Check browser console (F12) for more details</div>
        </div>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className="loading" style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div>⏳ Loading feedback data...</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          If this takes too long, check the console for errors
        </div>
      </div>
    );
  }

  console.log('Rendering feedback page with data:', feedbackData);

  if (!feedbackData.feedbacks || feedbackData.feedbacks.length === 0) {
    return (
      <div className="feedback-page" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="feedback-header" style={{ marginBottom: '30px', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '5px' }}>
            {event?.eventName || event?.title || 'Event'}
          </h2>
          <button 
            onClick={() => navigate(-1)} 
            className="btn-back-header"
            style={{
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '10px'
            }}
          >
            ← Back
          </button>
        </div>
        <div className="no-feedback" style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
          <p style={{ fontSize: '18px', color: '#374151', marginBottom: '10px', fontWeight: '500' }}>
            No feedback submitted yet for this event
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Feedback will appear here once participants who attended the event submit their reviews.
          </p>
        </div>
      </div>
    );
  }

  const { stats, feedbacks } = feedbackData;

  // Safety check for stats
  if (!stats) {
    return (
      <div className="error-container">
        <p className="error-message">Invalid feedback data received</p>
        <button onClick={() => navigate(-1)} className="btn-back">Go Back</button>
      </div>
    );
  }

  // Helper to safely format numbers
  const safeToFixed = (value, decimals = 1) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(decimals);
  };

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <h2>{event?.eventName || event?.title || 'Event'} - Feedback</h2>
        <button onClick={() => navigate(-1)} className="btn-back-header">← Back</button>
      </div>

      {/* Statistics Section */}
      <div className="stats-section">
        <div className="overall-rating">
          <h3>Overall Rating</h3>
          <div className="rating-display">
            <span className="rating-number">{safeToFixed(stats.averageRating)}</span>
            <div className="stars-large">
              {renderStars(Math.round(parseFloat(stats.averageRating) || 0))}
            </div>
            <span className="total-reviews">{stats.totalFeedbacks || 0} reviews</span>
          </div>
        </div>

        <div className="rating-distribution">
          <h3>Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="distribution-row">
              <span className="rating-label">{rating} stars</span>
              {renderDistributionBar(
                stats.ratingDistribution[rating] || 0,
                stats.totalFeedbacks
              )}
            </div>
          ))}
        </div>

        <div className="category-averages">
          <h3>Category Averages</h3>
          <div className="category-grid">
            <div className="category-card">
              <span className="category-name">Organization</span>
              <span className="category-score">{safeToFixed(stats.categoryAverages?.organization)}</span>
              {renderStars(Math.round(parseFloat(stats.categoryAverages?.organization) || 0))}
            </div>
            <div className="category-card">
              <span className="category-name">Content Quality</span>
              <span className="category-score">{safeToFixed(stats.categoryAverages?.contentQuality)}</span>
              {renderStars(Math.round(parseFloat(stats.categoryAverages?.contentQuality) || 0))}
            </div>
            <div className="category-card">
              <span className="category-name">Venue</span>
              <span className="category-score">{safeToFixed(stats.categoryAverages?.venue)}</span>
              {renderStars(Math.round(parseFloat(stats.categoryAverages?.venue) || 0))}
            </div>
            <div className="category-card">
              <span className="category-name">Overall Experience</span>
              <span className="category-score">{safeToFixed(stats.categoryAverages?.overallExperience)}</span>
              {renderStars(Math.round(parseFloat(stats.categoryAverages?.overallExperience) || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Feedbacks */}
      <div className="feedbacks-section">
        <h3>All Feedback ({feedbacks.length})</h3>
        <div className="feedbacks-list">
          {feedbacks.map((feedback, index) => (
            <div key={feedback._id} className="feedback-card">
              <div className="feedback-card-header">
                <div className="feedback-rating">
                  {renderStars(feedback.rating)}
                  <span className="rating-value">{feedback.rating}/5</span>
                </div>
                <span className="feedback-date">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>

              {feedback.feedback && (
                <div className="feedback-text">
                  <p>{feedback.feedback}</p>
                </div>
              )}

              {feedback.categoryRatings && (feedback.categoryRatings.organization ||
                feedback.categoryRatings.contentQuality ||
                feedback.categoryRatings.venue ||
                feedback.categoryRatings.overallExperience) && (
                <div className="feedback-categories">
                  <h4>Category Ratings:</h4>
                  <div className="category-ratings-display">
                    {feedback.categoryRatings?.organization && (
                      <div className="category-item">
                        <span>Organization: </span>
                        <span className="category-value">{feedback.categoryRatings.organization}/5</span>
                      </div>
                    )}
                    {feedback.categoryRatings?.contentQuality && (
                      <div className="category-item">
                        <span>Content: </span>
                        <span className="category-value">{feedback.categoryRatings.contentQuality}/5</span>
                      </div>
                    )}
                    {feedback.categoryRatings?.venue && (
                      <div className="category-item">
                        <span>Venue: </span>
                        <span className="category-value">{feedback.categoryRatings.venue}/5</span>
                      </div>
                    )}
                    {feedback.categoryRatings?.overallExperience && (
                      <div className="category-item">
                        <span>Overall: </span>
                        <span className="category-value">{feedback.categoryRatings.overallExperience}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {feedback.suggestions && (
                <div className="feedback-suggestions">
                  <h4>Suggestions:</h4>
                  <p>{feedback.suggestions}</p>
                </div>
              )}

              <div className="anonymous-badge">
                <span>🔒 Anonymous Participant #{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventFeedback;
