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
  const [registrationStatus, setRegistrationStatus] = useState(null);
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
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);

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
        console.log('Merchandise data:', response.data.event?.merchandise);
        console.log('Variants:', response.data.event?.merchandise?.variants);
        console.log('Registration status:', response.data.isRegistered);
        console.log('User logged in:', !!user);
        setEvent(response.data.event);
        setIsRegistered(response.data.isRegistered || false);
        setRegistrationStatus(response.data.registrationStatus || null);
        
        // Check for new messages if registered
        if (response.data.isRegistered && user) {
          try {
            const discussionRes = await discussionAPI.getEventDiscussions(id);
            const currentCount = discussionRes.data.discussions?.length || 0;
            const lastSeenCount = parseInt(localStorage.getItem(`discussion_${id}_count`) || '0');
            console.log(`[Notification] Current: ${currentCount}, LastSeen: ${lastSeenCount}`);
            if (currentCount > lastSeenCount) {
              setNewMessagesCount(currentCount - lastSeenCount);
            } else {
              setNewMessagesCount(0);
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
    
    // Refresh notification count when returning to this page
    const handleVisibilityChange = () => {
      if (!document.hidden && user && id) {
        // Page is visible again, refresh notification count
        discussionAPI.getEventDiscussions(id).then(res => {
          const currentCount = res.data.discussions?.length || 0;
          const lastSeenCount = parseInt(localStorage.getItem(`discussion_${id}_count`) || '0');
          console.log(`[Visibility] Current: ${currentCount}, LastSeen: ${lastSeenCount}`);
          if (currentCount > lastSeenCount) {
            setNewMessagesCount(currentCount - lastSeenCount);
          } else {
            setNewMessagesCount(0);
          }
        }).catch(err => console.log('Refresh notification error:', err));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, user]);

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
   * FIND VARIANT - handles both old (name-based) and new (size/color-based) formats
   */
  const findVariant = (size, color) => {
    if (!event?.merchandise?.variants) return null;
    
    // Try matching by size and color
    let variant = event.merchandise.variants.find(
      v => v.size === size && v.color === color
    );
    
    // Fallback: try matching by name format "SIZE - COLOR"
    if (!variant) {
      const variantName = `${size} - ${color}`;
      variant = event.merchandise.variants.find(v => v.name === variantName);
    }
    
    return variant;
  };

  /**
   * GET EFFECTIVE STOCK - calculates stock with fallback for zero-stock variants
   */
  const getEffectiveStock = (variant, variantIndex) => {
    if (!variant || !event?.merchandise) return 0;
    
    let stock = variant.stock || 0;
    
    // If stock is 0 but total stockQuantity exists, distribute equally
    if (stock === 0 && event.merchandise.stockQuantity && event.merchandise.stockQuantity > 0) {
      const numVariants = event.merchandise.variants?.length || 1;
      const baseStock = Math.floor(event.merchandise.stockQuantity / numVariants);
      const remainder = event.merchandise.stockQuantity % numVariants;
      
      if (variantIndex !== undefined && variantIndex >= 0) {
        stock = variantIndex < remainder ? baseStock + 1 : baseStock;
      } else {
        stock = baseStock;
      }
    }
    
    return stock;
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
        // Validate that merchandise details are selected
        if (!merchandiseSelection.size || !merchandiseSelection.color) {
          setError('Please select size and color');
          return;
        }

        // Find the selected variant
        const selectedVariant = findVariant(merchandiseSelection.size, merchandiseSelection.color);

        if (!selectedVariant) {
          setError(`Invalid variant selection: ${merchandiseSelection.size} - ${merchandiseSelection.color}`);
          return;
        }

        const requiredQuantity = merchandiseSelection.quantity || 1;
        const variantIndex = event.merchandise.variants.findIndex(
          v => (v.size === merchandiseSelection.size && v.color === merchandiseSelection.color) ||
               v.name === `${merchandiseSelection.size} - ${merchandiseSelection.color}`
        );
        const availableStock = getEffectiveStock(selectedVariant, variantIndex);

        if (availableStock < requiredQuantity) {
          setError(`Not enough stock. Only ${availableStock} unit(s) available for ${merchandiseSelection.size} - ${merchandiseSelection.color}`);
          return;
        }

        response = await registrationAPI.purchaseMerchandise(id, merchandiseSelection);
        // For merchandise, show payment proof upload modal
        if (response.data.registration) {
          setTicketData(response.data.registration);
          setShowPaymentProofModal(true);
          // Mark as registered with PENDING status initially
          setIsRegistered(true);
          setRegistrationStatus('PENDING');
        }
      } else {
        response = await registrationAPI.registerForEvent(id, { formResponse });
        setSuccess(response.data.message);
        setIsRegistered(true);
        setRegistrationStatus(response.data.registration?.status || 'CONFIRMED');
        
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
      }

    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  /**
   * HANDLE PAYMENT PROOF FILE SELECTION
   */
  const handlePaymentProofFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setPaymentProofFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * HANDLE PAYMENT PROOF UPLOAD
   */
  const handleUploadPaymentProof = async () => {
    if (!paymentProof) {
      setError('Please select a payment proof file');
      return;
    }

    try {
      setUploadingProof(true);
      setError('');

      await registrationAPI.uploadPaymentProof(ticketData._id, {
        paymentProof: paymentProof
      });

      setSuccess('Payment proof uploaded successfully. Awaiting organizer approval.');
      setShowPaymentProofModal(false);
      setIsRegistered(true);
      setRegistrationStatus('PENDING');
      setPaymentProofFile(null);
      setPaymentProof(null);

      // Redirect to registrations page after 2 seconds
      setTimeout(() => {
        navigate('/registrations');
      }, 2000);
    } catch (err) {
      console.error('Payment proof upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload payment proof. Please try again.');
    } finally {
      setUploadingProof(false);
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
    
    // Check deadline
    if (now >= deadline) return false;
    
    // For merchandise, also check stock availability
    if (event.eventType === 'MERCHANDISE') {
      // Check if any variant has effective stock
      const hasStock = event.merchandise?.variants?.some((v, idx) => {
        const effectiveStock = getEffectiveStock(v, idx);
        return effectiveStock > 0;
      });
      return !!hasStock;
    }
    
    // For normal events, check capacity
    if (event.registrationLimit && event.currentRegistrations >= event.registrationLimit) {
      return false;
    }
    
    return true;
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
              // Mark as seen and clear notification immediately
              discussionAPI.getEventDiscussions(id).then(res => {
                const count = res.data.discussions?.length || 0;
                localStorage.setItem(`discussion_${id}_count`, count.toString());
                console.log(`[Navigate] Marked as seen: ${count}`);
                setNewMessagesCount(0); // Clear badge immediately
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
                
                {field.fieldType?.toUpperCase() === 'TEXT' && (
                  <input
                    type="text"
                    placeholder={field.placeholder || field.fieldName}
                    required={field.required}
                    disabled={isRegistered}
                    onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                  />
                )}

                {field.fieldType?.toUpperCase() === 'TEXTAREA' && (
                  <textarea
                    placeholder={field.placeholder || field.fieldName}
                    required={field.required}
                    disabled={isRegistered}
                    onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                  />
                )}

                {field.fieldType?.toUpperCase() === 'DROPDOWN' && field.options && (
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
          
          {/* Total Stock Availability Alert */}
          {(() => {
            const totalStock = event.merchandise?.stockQuantity || event.merchandise?.stock || 
              (event.merchandise?.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0);
            return totalStock <= 0 ? (
              <div className="stock-status out-of-stock">
                <strong>❌ Out of Stock</strong>
                <p>This merchandise is currently unavailable. Please check back later.</p>
              </div>
            ) : (
              <div className="stock-status in-stock">
                <strong>✓ In Stock</strong>
                <p>Total Available: <span className="stock-count">{totalStock}</span> units</p>
              </div>
            );
          })()}

          {/* Inventory by Variant */}
          {event.merchandise?.variants && event.merchandise.variants.length > 0 && (
            <div className="inventory-table-section">
              <h3>Available Variants</h3>
              <div className="inventory-table">
                <div className="inventory-header">
                  <div className="inventory-col">Size</div>
                  <div className="inventory-col">Color</div>
                  <div className="inventory-col">Price</div>
                  <div className="inventory-col">Stock</div>
                </div>
                {event.merchandise.variants.map((variant, idx) => {
                  const effectiveStock = getEffectiveStock(variant, idx);
                  
                  return (
                    <div key={idx} className="inventory-row">
                      <div className="inventory-col">{variant.size || variant.name || 'Standard'}</div>
                      <div className="inventory-col">{variant.color || 'N/A'}</div>
                      <div className="inventory-col">₹{variant.price || 0}</div>
                      <div className="inventory-col">
                        <span className={`stock-badge ${effectiveStock > 0 ? 'available' : 'unavailable'}`}>
                          {effectiveStock} units
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                max={(() => {
                  const selectedVariant = findVariant(merchandiseSelection.size, merchandiseSelection.color);
                  const variantIndex = event?.merchandise?.variants?.findIndex(
                    v => (v.size === merchandiseSelection.size && v.color === merchandiseSelection.color) ||
                         v.name === `${merchandiseSelection.size} - ${merchandiseSelection.color}`
                  ) ?? -1;
                  const stock = getEffectiveStock(selectedVariant, variantIndex);
                  return stock || 1;
                })()}
                value={merchandiseSelection.quantity}
                onChange={(e) => {
                  const selectedVariant = findVariant(merchandiseSelection.size, merchandiseSelection.color);
                  const variantIndex = event?.merchandise?.variants?.findIndex(
                    v => (v.size === merchandiseSelection.size && v.color === merchandiseSelection.color) ||
                         v.name === `${merchandiseSelection.size} - ${merchandiseSelection.color}`
                  ) ?? -1;
                  const availableStock = getEffectiveStock(selectedVariant, variantIndex);
                  handleMerchandiseChange('quantity', Math.min(parseInt(e.target.value) || 1, availableStock || 1));
                }}
                disabled={isRegistered || !merchandiseSelection.size || !merchandiseSelection.color}
              />
              {merchandiseSelection.size && merchandiseSelection.color && (
                <small>
                  {(() => {
                    const selectedVariant = findVariant(merchandiseSelection.size, merchandiseSelection.color);
                    const variantIndex = event?.merchandise?.variants?.findIndex(
                      v => (v.size === merchandiseSelection.size && v.color === merchandiseSelection.color) ||
                           v.name === `${merchandiseSelection.size} - ${merchandiseSelection.color}`
                    ) ?? -1;
                    const stock = getEffectiveStock(selectedVariant, variantIndex);
                    
                    return (
                      <>
                        Available: <strong>{stock}</strong> unit(s)
                        {stock <= 5 && stock > 0 && <span style={{color: '#f97316', marginLeft: '8px'}}>⚠️ Low Stock</span>}
                        {stock === 0 && <span style={{color: '#ef4444', marginLeft: '8px'}}>❌ Out of Stock</span>}
                      </>
                    );
                  })()}
                </small>
              )}
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
      {!isRegistered && isRegistrationOpen() && (event.eventType !== 'MERCHANDISE' || ((event.merchandise?.stockQuantity || event.merchandise?.stock || 0) > 0)) && (
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

      {/* Registered Button */}
      {isRegistered && (
        <div className="register-section">
          <button 
            disabled
            className="registered-btn"
          >
            {registrationStatus === 'PENDING' ? '⏳ Registration Pending' : '✓ Already Registered'}
          </button>
          <p className="registered-hint">
            {registrationStatus === 'PENDING' 
              ? 'Your payment is awaiting organizer approval. You will receive an email once approved.' 
              : 'You are registered for this event. Check your email for your ticket details.'}
          </p>
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

      {/* Payment Proof Upload Modal - For Merchandise */}
      {showPaymentProofModal && ticketData && (
        <div className="modal-overlay" onClick={() => setShowPaymentProofModal(false)}>
          <div className="modal-content payment-proof-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPaymentProofModal(false)}>×</button>
            
            <div className="payment-proof-header">
              <h2>💳 Upload Payment Proof</h2>
              <p>Please upload proof of your payment to complete the merchandise purchase</p>
            </div>

            {error && <div className="error-box" style={{marginBottom: '20px'}}>{error}</div>}

            <div className="payment-proof-form">
              <div className="merchandise-summary">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Event:</span>
                  <strong>{event.eventName}</strong>
                </div>
                <div className="summary-item">
                  <span>Quantity:</span>
                  <strong>{ticketData.merchandiseDetails?.quantity || 1}</strong>
                </div>
                <div className="summary-item">
                  <span>Amount to Pay:</span>
                  <strong className="amount">₹{ticketData.amountPaid}</strong>
                </div>
              </div>

              <div className="form-field">
                <label>Payment Screenshot/Proof <span className="required">*</span></label>
                <p className="field-hint">Upload a screenshot of your payment (UPI, Bank Transfer, etc.)</p>
                
                <div className="file-input-wrapper">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handlePaymentProofFile}
                    id="payment-proof-input"
                  />
                  <label htmlFor="payment-proof-input" className="file-input-label">
                    📎 Choose File (JPG, PNG, or PDF - Max 5MB)
                  </label>
                </div>

                {paymentProofFile && (
                  <div className="file-selected">
                    <p>✓ File selected: {paymentProofFile.name}</p>
                  </div>
                )}

                {paymentProof && paymentProofFile?.type.startsWith('image/') && (
                  <div className="proof-preview">
                    <p>Preview:</p>
                    <img src={paymentProof} alt="Payment Proof Preview" className="proof-image" />
                  </div>
                )}
              </div>

              <p className="payment-info">
                📋 After uploading, the event organizer will review your payment proof and approve or reject it within 24 hours.
              </p>
            </div>

            <div className="payment-actions">
              <button 
                className="btn-primary" 
                onClick={handleUploadPaymentProof}
                disabled={!paymentProof || uploadingProof}
              >
                {uploadingProof ? 'Uploading...' : 'Upload & Submit'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowPaymentProofModal(false);
                  setPaymentProof(null);
                  setPaymentProofFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails;
