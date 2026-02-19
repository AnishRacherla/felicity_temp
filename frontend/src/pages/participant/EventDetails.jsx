/**
 * EVENT DETAILS PAGE
 * 
 * View full event details and register
 * - Shows all event information
 * - Custom registration form (if normal event)
 * - Merchandise options (if merchandise event)
 * - Register button
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, discussionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './EventDetails.css';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  // Form state
  const [formResponse, setFormResponse] = useState({});
  const [merchandiseSelection, setMerchandiseSelection] = useState({
    size: '',
    color: '',
    variant: '',
    quantity: 1
  });

  /**
   * FETCH EVENT DETAILS
   */
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await eventAPI.getEventDetails(id);
        console.log('Event details:', response.data);
        console.log('Registration status:', response.data.isRegistered);
        console.log('User logged in:', !!user);
        setEvent(response.data.event);
        setIsRegistered(response.data.isRegistered || false);
        
        // Check for new messages if registered
        if (response.data.isRegistered && user) {
          try {
            const discussionRes = await discussionAPI.getEventDiscussions(id);
            const currentCount = discussionRes.data.discussions?.length || 0;
            const lastSeenCount = parseInt(localStorage.getItem(`discussion_${id}_count`) || '0');
            if (currentCount > lastSeenCount) {
              setNewMessagesCount(currentCount - lastSeenCount);
            }
          } catch (err) {
            console.log('Discussion check error:', err.response?.status);
          }
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        if (err.code === 'ERR_NETWORK') {
          setError('⚠️ Cannot connect to server. Please make sure backend is running.');
        } else {
          setError(err.response?.data?.message || 'Failed to load event details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  /**
   * HANDLE CUSTOM FORM INPUT CHANGE
   */
  const handleFormChange = (fieldName, value) => {
    setFormResponse({
      ...formResponse,
      [fieldName]: value
    });
  };

  /**
   * HANDLE MERCHANDISE SELECTION
   */
  const handleMerchandiseChange = (field, value) => {
    setMerchandiseSelection({
      ...merchandiseSelection,
      [field]: value
    });
  };

  /**
   * HANDLE REGISTRATION
   */
  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setRegistering(true);
      setError('');

      let response;
      if (event.eventType === 'MERCHANDISE') {
        response = await registrationAPI.purchaseMerchandise(id, merchandiseSelection);
      } else {
        response = await registrationAPI.registerForEvent(id, { formResponse });
      }

      setSuccess(response.data.message);
      setIsRegistered(true);
      
      // Show ticket modal with QR code if registration data is available
      if (response.data.registration) {
        setTicketData(response.data.registration);
        setShowTicketModal(true);
      } else {
        // Fallback: Redirect to registrations page after 2 seconds
        setTimeout(() => {
          navigate('/registrations');
        }, 2000);
      }

    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  /**
   * FORMAT DATE
   */
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  /**
   * CHECK IF REGISTRATION IS OPEN
   */
  const isRegistrationOpen = () => {
    if (!event) return false;
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return now < deadline && event.currentRegistrations < event.registrationLimit;
  };

  if (loading) {
    return (
      <div className="event-details loading">
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details">
        <div className="error-box">Event not found.</div>
      </div>
    );
  }

  return (
    <div className="event-details">
      {/* Back Button */}
      <button onClick={() => navigate('/browse-events')} className="back-btn">
        ← Back to Events
      </button>

      {/* Success Message */}
      {success && (
        <div className="success-box">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* Event Header */}
      <div className="event-header">
        <div className="event-badges">
          <span className={`badge ${event.eventType.toLowerCase()}`}>
            {event.eventType}
          </span>
          <span className="badge eligibility">
            {event.eligibility.replace('_', ' ')}
          </span>
          {isRegistered && (
            <span className="badge registered">✓ REGISTERED</span>
          )}
        </div>

        <h1>{event.eventName}</h1>

        <p className="organizer-info">
          Organized by <strong>{event.organizer?.organizerName}</strong>
          {event.organizer?.category && ` • ${event.organizer.category}`}
        </p>
      </div>

      {/* Event Info Grid */}
      <div className="event-info-grid">
        <div className="info-card">
          <span className="icon">📅</span>
          <div>
            <div className="info-label">Event Date</div>
            <div className="info-value">{formatDate(event.eventStartDate)}</div>
          </div>
        </div>

        <div className="info-card">
          <span className="icon">⏰</span>
          <div>
            <div className="info-label">Registration Deadline</div>
            <div className="info-value">{formatDate(event.registrationDeadline)}</div>
          </div>
        </div>

        {event.registrationFee > 0 && (
          <div className="info-card">
            <span className="icon">₹</span>
            <div>
              <div className="info-label">Registration Fee</div>
              <div className="info-value">₹{event.registrationFee}</div>
            </div>
          </div>
        )}

        <div className="info-card">
          <span className="icon">👥</span>
          <div>
            <div className="info-label">Participants</div>
            <div className="info-value">
              {event.currentRegistrations}/{event.registrationLimit || '∞'}
            </div>
          </div>
        </div>
      </div>

      {/* Event Description */}
      <div className="event-section">
        <h2>About This Event</h2>
        <p className="event-description">{event.description}</p>
      </div>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="event-section">
          <h3>Tags</h3>
          <div className="tags-list">
            {event.tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Discussion Button - Prominent Location for Registered Participants */}
      {isRegistered && (
        <div className="discussion-section-prominent">
          <button 
            onClick={() => {
              console.log('Discussion button clicked!');
              // Mark as seen
              discussionAPI.getEventDiscussions(id).then(res => {
                const count = res.data.discussions?.length || 0;
                localStorage.setItem(`discussion_${id}_count`, count.toString());
              }).catch(err => console.log('Mark as seen error:', err));
              navigate(`/events/${id}/discussion`);
            }}
            className="discussion-btn-prominent"
          >
            💬 Join Event Discussion Forum
            {newMessagesCount > 0 && (
              <span className="notification-badge">{newMessagesCount}</span>
            )}
          </button>
          <p className="discussion-hint">Connect with other participants, ask questions, and share experiences</p>
        </div>
      )}

      {/* Custom Form (for Normal Events) */}
      {event.eventType === 'NORMAL' && event.customForm && event.customForm.length > 0 && (
        <div className="event-section">
          <h2>Registration Form</h2>
          <div className="custom-form">
            {event.customForm.map((field, index) => (
              <div key={index} className="form-field">
                <label>
                  {field.fieldName}
                  {field.required && <span className="required">*</span>}
                </label>
                
                {field.fieldType === 'text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder || field.fieldName}
                    required={field.required}
                    disabled={isRegistered}
                    onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                  />
                )}

                {field.fieldType === 'textarea' && (
                  <textarea
                    placeholder={field.placeholder || field.fieldName}
                    required={field.required}
                    disabled={isRegistered}
                    onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                  />
                )}

                {field.fieldType === 'dropdown' && field.options && (
                  <select
                    required={field.required}
                    disabled={isRegistered}
                    onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {field.options.map((option, i) => (
                      <option key={i} value={option}>{option}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merchandise Options */}
      {event.eventType === 'MERCHANDISE' && event.merchandise && (
        <div className="event-section">
          <h2>Merchandise Options</h2>
          <div className="merchandise-selection">
            {/* Sizes */}
            {event.merchandise.sizes && (
              <div className="form-field">
                <label>Size <span className="required">*</span></label>
                <select
                  value={merchandiseSelection.size}
                  onChange={(e) => handleMerchandiseChange('size', e.target.value)}
                  disabled={isRegistered}
                  required
                >
                  <option value="">Select size...</option>
                  {event.merchandise.sizes.map((size, i) => (
                    <option key={i} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Colors */}
            {event.merchandise.colors && (
              <div className="form-field">
                <label>Color <span className="required">*</span></label>
                <select
                  value={merchandiseSelection.color}
                  onChange={(e) => handleMerchandiseChange('color', e.target.value)}
                  disabled={isRegistered}
                  required
                >
                  <option value="">Select color...</option>
                  {event.merchandise.colors.map((color, i) => (
                    <option key={i} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div className="form-field">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                max={event.merchandise.stock}
                value={merchandiseSelection.quantity}
                onChange={(e) => handleMerchandiseChange('quantity', parseInt(e.target.value))}
                disabled={isRegistered}
              />
              <small>Available: {event.merchandise.stock}</small>
            </div>
          </div>
        </div>
      )}

      {/* Organizer Contact */}
      {event.organizer?.contactEmail && (
        <div className="event-section contact-section">
          <h3>Contact Organizer</h3>
          <p>📧 {event.organizer.contactEmail}</p>
        </div>
      )}

      {/* Register Button */}
      {!isRegistered && isRegistrationOpen() && (
        <div className="register-section">
          <button 
            onClick={handleRegister} 
            disabled={registering}
            className="register-btn"
          >
            {registering ? 'Registering...' : `Register Now ${event.registrationFee > 0 ? `- ₹${event.registrationFee}` : '- FREE'}`}
          </button>
        </div>
      )}

      {/* Discussion section moved to prominent location above */}

      {!isRegistrationOpen() && !isRegistered && (
        <div className="closed-message">
          Registration for this event is closed.
        </div>
      )}

      {/* Ticket Modal - Show QR Code After Registration */}
      {showTicketModal && ticketData && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content ticket-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTicketModal(false)}>×</button>
            
            <div className="ticket-success">
              <h2>🎉 Registration Successful!</h2>
              <p>Your ticket has been generated</p>
            </div>

            <div className="ticket-details">
              <div className="ticket-id-box">
                <label>Ticket ID</label>
                <div className="ticket-id">{ticketData.ticketId}</div>
              </div>

              {ticketData.qrCode && (
                <div className="qr-code-section">
                  <p><strong>Your QR Code</strong></p>
                  <img src={ticketData.qrCode} alt="Ticket QR Code" className="qr-code-image" />
                  <p className="qr-hint">Show this QR code at the event venue</p>
                </div>
              )}

              <div className="ticket-info">
                <p><strong>Event:</strong> {event.eventName}</p>
                <p><strong>Date:</strong> {formatDate(event.eventStartDate)}</p>
                {ticketData.paymentStatus && (
                  <p><strong>Payment Status:</strong> <span className={`status-${ticketData.paymentStatus.toLowerCase()}`}>{ticketData.paymentStatus}</span></p>
                )}
              </div>

              <div className="email-notice">
                <p>📧 A copy of your ticket has been sent to your email: <strong>{user?.email}</strong></p>
                <p className="email-hint">If you don't receive it, check your spam folder or view it in "My Registrations"</p>
              </div>
            </div>

            <div className="ticket-actions">
              <button 
                className="btn-primary" 
                onClick={() => navigate('/registrations')}
              >
                View All My Tickets
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowTicketModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails;
