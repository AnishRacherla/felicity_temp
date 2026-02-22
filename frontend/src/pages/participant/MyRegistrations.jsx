/**
 * MY REGISTRATIONS PAGE
 * 
 * View all event registrations and tickets
 * - Show QR codes for tickets
 * - Download tickets
 * - Track payment status
 * - Cancel registrations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI, registrationAPI, feedbackAPI, discussionAPI } from '../../services/api';
import './MyRegistrations.css';

function MyRegistrations() {
  const navigate = useNavigate();

  // State
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, confirmed, pending, cancelled
  const [uploadingId, setUploadingId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  
  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRegistration, setFeedbackRegistration] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    feedback: '',
    categories: {
      organization: 0,
      content: 0,
      venue: 0,
      overall: 0
    },
    suggestions: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState({});
  
  // Notification counts for each event
  const [notificationCounts, setNotificationCounts] = useState({});

  /**
   * FETCH USER REGISTRATIONS
   */
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await participantAPI.getMyRegistrations();
        console.log('Registrations fetched:', response.data); // Debug log
        setRegistrations(response.data.registrations || []);
      } catch (err) {
        console.error('Failed to fetch registrations:', err);
        if (err.code === 'ERR_NETWORK') {
          setError('⚠️ Cannot connect to server. Please make sure backend is running.');
        } else {
          setError(err.response?.data?.message || 'Failed to load registrations.');
        }
        setRegistrations([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  /**
   * FETCH NOTIFICATION COUNTS FOR ALL EVENTS
   */
  useEffect(() => {
    const fetchNotificationCounts = async () => {
      if (registrations.length === 0) return;
      
      const counts = {};
      for (const reg of registrations) {
        if (reg.status === 'CONFIRMED' && reg.event?._id) {
          try {
            const eventId = reg.event._id;
            const res = await discussionAPI.getEventDiscussions(eventId);
            const currentCount = res.data.discussions?.length || 0;
            const lastSeenCount = parseInt(localStorage.getItem(`discussion_${eventId}_count`) || '0');
            
            if (currentCount > lastSeenCount) {
              counts[eventId] = currentCount - lastSeenCount;
            }
          } catch (err) {
            console.log('Failed to fetch discussion count for event:', reg.event._id);
          }
        }
      }
      setNotificationCounts(counts);
    };
    
    fetchNotificationCounts();
  }, [registrations]);

  /**
   * FILTER REGISTRATIONS
   */
  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true;
    return reg.status.toLowerCase() === filter.toLowerCase();
  });

  /**
   * FORMAT DATE
   */
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  /**
   * DOWNLOAD TICKET
   */
  const downloadTicket = (registration) => {
    // Create a simple HTML ticket
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event Ticket</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
          }
          .ticket {
            border: 2px solid #4f46e5;
            border-radius: 12px;
            padding: 30px;
            background: white;
          }
          h1 { color: #1f2937; margin-bottom: 20px; }
          .ticket-id {
            background: #f3f4f6;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 18px;
            font-weight: bold;
            color: #4f46e5;
            margin: 20px 0;
          }
          .qr-code { text-align: center; margin: 30px 0; }
          .qr-code img { max-width: 300px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px; }
          .details { margin: 20px 0; line-height: 1.8; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>🎟️ Event Ticket</h1>
          <div class="ticket-id">Ticket ID: ${registration.ticketId}</div>
          
          <div class="details">
            <p><strong>Event:</strong> ${registration.event?.eventName || 'N/A'}</p>
            <p><strong>Date:</strong> ${formatDate(registration.event?.eventStartDate)}</p>
            <p><strong>Status:</strong> ${registration.status}</p>
            <p><strong>Payment:</strong> ${registration.paymentStatus}</p>
          </div>

          <div class="qr-code">
            <p><strong>Your QR Code</strong></p>
            <img src="${registration.qrCode}" alt="Ticket QR Code" />
            <p style="font-size: 12px; color: #6b7280;">Show this QR code at the event venue</p>
          </div>

          <div class="footer">
            <p>This is your official event ticket. Please save it for entry.</p>
            <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([ticketHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${registration.ticketId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * CANCEL REGISTRATION
   */
  const cancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      await registrationAPI.cancelRegistration(registrationId);
      
      // Update local state
      setRegistrations(registrations.map(reg => 
        reg._id === registrationId 
          ? { ...reg, status: 'CANCELLED' }
          : reg
      ));

      alert('Registration cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      alert(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  /**
   * HANDLE FILE SELECTION
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setPaymentProofFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * UPLOAD PAYMENT PROOF
   */
  const uploadPaymentProof = async () => {
    if (!paymentProofFile) {
      alert('Please select a payment proof image');
      return;
    }

    try {
      setUploadingId(selectedRegistration._id);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await registrationAPI.uploadPaymentProof(selectedRegistration._id, {
            paymentProof: reader.result,
          });

          alert('✅ Payment proof uploaded successfully! Awaiting organizer approval.');
          
          // Refresh registrations
          const response = await participantAPI.getMyRegistrations();
          setRegistrations(response.data.registrations || []);
          
          // Close modal
          setShowUploadModal(false);
          setPaymentProofFile(null);
          setPaymentProofPreview('');
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to upload payment proof');
        } finally {
          setUploadingId(null);
        }
      };
      reader.readAsDataURL(paymentProofFile);
    } catch (err) {
      alert('Failed to upload payment proof');
      setUploadingId(null);
    }
  };

  /**
   * OPEN UPLOAD MODAL
   */
  const openUploadModal = (registration) => {
    setSelectedRegistration(registration);
    setPaymentProofFile(null);
    setPaymentProofPreview('');
    setShowUploadModal(true);
  };

  /**
   * OPEN FEEDBACK MODAL
   */
  const openFeedbackModal = (registration) => {
    setFeedbackRegistration(registration);
    setFeedbackData({
      rating: 0,
      feedback: '',
      categories: {
        organization: 0,
        content: 0,
        venue: 0,
        overall: 0
      },
      suggestions: ''
    });
    setShowFeedbackModal(true);
  };

  /**
   * HANDLE FEEDBACK RATING CHANGE
   */
  const handleRatingChange = (field, value) => {
    if (field === 'rating') {
      setFeedbackData({ ...feedbackData, rating: value });
    } else {
      setFeedbackData({
        ...feedbackData,
        categories: { ...feedbackData.categories, [field]: value }
      });
    }
  };

  /**
   * SUBMIT FEEDBACK
   */
  const submitFeedback = async () => {
    if (!feedbackData.rating || !feedbackData.feedback.trim()) {
      alert('Please provide a rating and feedback');
      return;
    }

    try {
      setSubmittingFeedback(true);
      await feedbackAPI.submitFeedback(feedbackRegistration._id, feedbackData);
      
      alert('✅ Thank you for your feedback!');
      
      // Update feedback status
      setFeedbackStatus({
        ...feedbackStatus,
        [feedbackRegistration._id]: true
      });
      
      setShowFeedbackModal(false);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  /**
   * CHECK FEEDBACK STATUS FOR ATTENDED EVENTS
   */
  useEffect(() => {
    const checkFeedbackStatuses = async () => {
      const attendedRegs = registrations.filter(r => r.attended);
      const statuses = {};
      
      for (const reg of attendedRegs) {
        try {
          const response = await feedbackAPI.checkFeedbackStatus(reg._id);
          statuses[reg._id] = response.data.hasSubmitted;
        } catch (err) {
          console.error('Error checking feedback status:', err);
        }
      }
      
      setFeedbackStatus(statuses);
    };

    if (registrations.length > 0) {
      checkFeedbackStatuses();
    }
  }, [registrations]);

  if (loading) {
    return (
      <div className="my-registrations loading">
        <p>Loading your registrations...</p>
      </div>
    );
  }

  return (
    <div className="my-registrations">
      {/* Header */}
      <div className="page-header">
        <h1>My Registrations</h1>
        <p>View and manage your event tickets</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({registrations.length})
        </button>
        <button 
          className={filter === 'confirmed' ? 'active' : ''}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed ({registrations.filter(r => r.status === 'CONFIRMED').length})
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending ({registrations.filter(r => r.status === 'PENDING').length})
        </button>
        <button 
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({registrations.filter(r => r.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="no-registrations">
          <p>No registrations found.</p>
          <button onClick={() => navigate('/browse-events')} className="browse-btn">
            Browse Events
          </button>
        </div>
      ) : (
        <div className="registrations-list">
          {filteredRegistrations.map((registration) => (
            <div key={registration._id} className="registration-card">
              {/* Status Badge */}
              <div className="status-badges">
                <span className={`status-badge ${registration.status.toLowerCase()}`}>
                  {registration.status}
                </span>
                <span className={`payment-badge ${registration.paymentStatus.toLowerCase()}`}>
                  {registration.paymentStatus}
                </span>
              </div>

              {/* Event Info */}
              <div className="registration-content">
                <div className="registration-info">
                  <h3>{registration.event?.eventName || 'Event Name Unavailable'}</h3>
                  
                  <div className="info-row">
                    <span className="label">Ticket ID:</span>
                    <span className="value ticket-id">{registration.ticketId}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Event Date:</span>
                    <span className="value">
                      {registration.event?.eventStartDate 
                        ? formatDate(registration.event.eventStartDate)
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="label">Registered On:</span>
                    <span className="value">{formatDate(registration.createdAt)}</span>
                  </div>

                  {registration.amountPaid > 0 && (
                    <div className="info-row">
                      <span className="label">Amount Paid:</span>
                      <span className="value">₹{registration.amountPaid}</span>
                    </div>
                  )}

                  {registration.attended && (
                    <div className="attended-badge">
                      ✓ Attended
                    </div>
                  )}

                  {/* Payment Rejection Reason */}
                  {registration.paymentRejectionReason && (
                    <div className="rejection-notice">
                      <strong>❌ Payment Rejected:</strong>
                      <p>{registration.paymentRejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                {registration.qrCode && (
                  <div className="qr-code-section">
                    <img 
                      src={registration.qrCode} 
                      alt="QR Code" 
                      className="qr-code-image"
                    />
                    <p className="qr-hint">Show at venue</p>
                  </div>
                )}
              </div>

              {/* Payment Proof Upload - For merchandise orders */}
              {registration.registrationType === 'MERCHANDISE' && 
               (registration.paymentStatus === 'UNPAID' || registration.status === 'REJECTED') && (
                <div className="payment-upload-section">
                  <p className="upload-hint">
                    {registration.paymentRejectionReason 
                      ? '⚠️ Please upload a new payment proof' 
                      : 'Please upload payment proof to complete your order'}
                  </p>
                  <button 
                    onClick={() => openUploadModal(registration)}
                    className="action-btn upload"
                  >
                    📤 Upload Payment Proof
                  </button>
                </div>
              )}

              {/* Pending Approval Notice */}
              {registration.paymentStatus === 'PENDING_APPROVAL' && (
                <div className="pending-notice">
                  ⏳ Payment proof submitted. Awaiting organizer approval.
                </div>
              )}

              {/* Actions */}
              {registration.status === 'CONFIRMED' && (
                <div className="registration-actions">
                  <button 
                    onClick={() => downloadTicket(registration)}
                    className="action-btn download"
                  >
                    📥 Download Ticket
                  </button>
                  <button 
                    onClick={() => navigate(`/events/${registration.event?._id}`)}
                    className="action-btn view"
                  >
                    View Event
                  </button>
                  {registration.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => {
                        const eventId = registration.event?._id;
                        if (eventId) {
                          // Mark as seen and clear badge
                          discussionAPI.getEventDiscussions(eventId).then(res => {
                            const count = res.data.discussions?.length || 0;
                            localStorage.setItem(`discussion_${eventId}_count`, count.toString());
                            console.log(`[MyReg] Marked event ${eventId} as seen: ${count}`);
                            // Clear badge from state
                            setNotificationCounts(prev => {
                              const updated = { ...prev };
                              delete updated[eventId];
                              return updated;
                            });
                          }).catch(err => console.log('Mark as seen error:', err));
                        }
                        navigate(`/events/${eventId}/discussion`);
                      }}
                      className="action-btn discussion"
                      title="Join event discussion forum"
                      style={{ position: 'relative' }}
                    >
                      💬 Discussion
                      {notificationCounts[registration.event?._id] > 0 && (
                        <span className="notification-badge">{notificationCounts[registration.event?._id]}</span>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => cancelRegistration(registration._id)}
                    className="action-btn cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Feedback Section - For attended events */}
              {registration.attended && !feedbackStatus[registration._id] && (
                <div className="feedback-section">
                  <p className="feedback-hint">✨ How was your experience? Share your feedback!</p>
                  <button 
                    onClick={() => openFeedbackModal(registration)}
                    className="action-btn feedback"
                  >
                    📝 Submit Feedback
                  </button>
                </div>
              )}

              {registration.attended && feedbackStatus[registration._id] && (
                <div className="feedback-submitted">
                  ✅ Feedback submitted - Thank you!
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Payment Proof Modal */}
      {showUploadModal && selectedRegistration && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Payment Proof</h2>
            
            <div className="modal-body">
              <p><strong>Event:</strong> {selectedRegistration.event?.eventName}</p>
              <p><strong>Amount:</strong> ₹{selectedRegistration.amountPaid}</p>
              <p><strong>Ticket ID:</strong> {selectedRegistration.ticketId}</p>

              {selectedRegistration.paymentRejectionReason && (
                <div className="rejection-info">
                  <strong>Previous Rejection Reason:</strong>
                  <p>{selectedRegistration.paymentRejectionReason}</p>
                </div>
              )}

              <div className="upload-instructions">
                <h4>Instructions:</h4>
                <ul>
                  <li>Take a clear photo of your payment receipt/screenshot</li>
                  <li>Make sure transaction details are visible</li>
                  <li>Format: JPG, PNG (max 5MB)</li>
                  <li>Organizer will review and approve within 24-48 hours</li>
                </ul>
              </div>

              <div className="file-upload-area">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                  id="payment-proof-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="payment-proof-input" className="upload-label">
                  {paymentProofPreview ? (
                    <div className="preview-container">
                      <img src={paymentProofPreview} alt="Payment Proof Preview" />
                      <p>Click to change image</p>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <p>Click to select payment proof image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={uploadPaymentProof}
                className="btn-upload"
                disabled={!paymentProofFile || uploadingId === selectedRegistration._id}
              >
                {uploadingId === selectedRegistration._id ? 'Uploading...' : 'Upload & Submit'}
              </button>
              <button onClick={() => setShowUploadModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackRegistration && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📝 Submit Feedback</h2>
            
            <div className="modal-body">
              <p className="event-name-feedback">{feedbackRegistration.event?.eventName}</p>
              
              {/* Overall Rating */}
              <div className="rating-section">
                <label>Overall Rating <span className="required">*</span></label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange('rating', star)}
                      className={`star ${feedbackData.rating >= star ? 'filled' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div className="form-field">
                <label>Your Feedback <span className="required">*</span></label>
                <textarea
                  value={feedbackData.feedback}
                  onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                  placeholder="Share your experience about the event..."
                  maxLength={1000}
                  rows={4}
                />
                <small>{feedbackData.feedback.length}/1000</small>
              </div>

              {/* Category Ratings */}
              <div className="category-ratings">
                <h4>Rate Specific Aspects (Optional)</h4>
                
                {[
                  { key: 'organization', label: 'Organization & Management' },
                  { key: 'content', label: 'Content Quality' },
                  { key: 'venue', label: 'Venue & Facilities' },
                  { key: 'overall', label: 'Overall Experience' }
                ].map(category => (
                  <div key={category.key} className="category-rating-row">
                    <span className="category-label">{category.label}</span>
                    <div className="star-rating small">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(category.key, star)}
                          className={`star ${feedbackData.categories[category.key] >= star ? 'filled' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="form-field">
                <label>Suggestions for Improvement (Optional)</label>
                <textarea
                  value={feedbackData.suggestions}
                  onChange={(e) => setFeedbackData({ ...feedbackData, suggestions: e.target.value })}
                  placeholder="Any suggestions to make future events better?"
                  maxLength={500}
                  rows={3}
                />
                <small>{feedbackData.suggestions.length}/500</small>
              </div>

              <p className="anonymous-note">
                🔒 Your feedback is <strong>anonymous</strong> and will help improve future events
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={submitFeedback}
                className="btn-upload"
                disabled={!feedbackData.rating || !feedbackData.feedback.trim() || submittingFeedback}
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button onClick={() => setShowFeedbackModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRegistrations;
