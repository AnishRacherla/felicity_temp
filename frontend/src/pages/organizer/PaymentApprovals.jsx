/**
 * PAYMENT APPROVALS PAGE (Organizer)
 * 
 * View and manage merchandise payment approvals
 * - View all registrations with payment proofs
 * - Filter by status (Pending/Approved/Rejected)
 * - Approve or reject payments
 * - View payment proof images
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import './PaymentApprovals.css';

function PaymentApprovals() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    console.log('PaymentApprovals - eventId from useParams:', eventId);
    if (eventId) {
      fetchRegistrations();
      fetchEventDetails();
    } else {
      console.error('PaymentApprovals - eventId is undefined!');
      setError('Event ID not found');
      setLoading(false);
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      console.log('Fetching event details for:', eventId);
      const response = await organizerAPI.getEventDetails(eventId);
      console.log('Event details response:', response.data);
      setEventDetails(response.data.event);
    } catch (err) {
      console.error('Failed to fetch event details:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching registrations for event:', eventId);
      const response = await organizerAPI.getEventRegistrations(eventId);
      console.log('Registrations response:', response.data);
      
      // Filter only merchandise registrations
      const merchandiseRegs = response.data.registrations.filter(
        reg => reg.registrationType === 'MERCHANDISE'
      );
      
      console.log('Merchandise registrations:', merchandiseRegs);
      setRegistrations(merchandiseRegs);
    } catch (err) {
      setError('Failed to load registrations');
      console.error('Fetch registrations error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    if (!window.confirm('Approve this payment? This will generate a ticket and send confirmation email.')) {
      return;
    }

    try {
      setProcessingId(registrationId);
      await organizerAPI.approveMerchandisePayment(registrationId);
      await fetchRegistrations();
      alert('✅ Payment approved! Ticket generated and email sent.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      alert('Please provide a rejection reason (minimum 5 characters)');
      return;
    }

    try {
      setProcessingId(selectedRegistration._id);
      await organizerAPI.rejectMerchandisePayment(selectedRegistration._id, {
        reason: rejectionReason.trim(),
      });
      await fetchRegistrations();
      alert('Payment rejected. Participant can resubmit.');
      setShowModal(false);
      setRejectionReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (registration) => {
    setSelectedRegistration(registration);
    setRejectionReason('');
    setShowModal(true);
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true;
    if (filter === 'pending') return reg.paymentStatus === 'PENDING_APPROVAL';
    if (filter === 'approved') return reg.paymentStatus === 'PAID';
    if (filter === 'rejected') return reg.status === 'REJECTED';
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="payment-approvals">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        <div>
          <h1>Payment Approvals</h1>
          <p>{eventDetails?.eventName || 'Event'} - Merchandise Orders</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending ({registrations.filter(r => r.paymentStatus === 'PENDING_APPROVAL').length})
        </button>
        <button 
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved ({registrations.filter(r => r.paymentStatus === 'PAID').length})
        </button>
        <button 
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({registrations.filter(r => r.status === 'REJECTED').length})
        </button>
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({registrations.length})
        </button>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="no-data">
          No {filter === 'all' ? '' : filter} registrations found
        </div>
      ) : (
        <div className="registrations-grid">
          {filteredRegistrations.map((registration) => (
            <div key={registration._id} className="registration-card">
              <div className="card-header">
                <div className="participant-info">
                  <h3>{registration.participant?.firstName} {registration.participant?.lastName}</h3>
                  <span className="ticket-id">{registration.ticketId}</span>
                </div>
                <span className={`status-badge ${registration.paymentStatus.toLowerCase()}`}>
                  {registration.paymentStatus.replace('_', ' ')}
                </span>
              </div>

              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Email:</strong>
                    <span>{registration.participant?.email}</span>
                  </div>
                  <div className="info-item">
                    <strong>Amount:</strong>
                    <span>₹{registration.amountPaid}</span>
                  </div>
                  <div className="info-item">
                    <strong>Size:</strong>
                    <span>{registration.merchandiseDetails?.size || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Quantity:</strong>
                    <span>{registration.merchandiseDetails?.quantity || 1}</span>
                  </div>
                  <div className="info-item">
                    <strong>Registered:</strong>
                    <span>{formatDate(registration.createdAt)}</span>
                  </div>
                  {registration.paymentProofUploadedAt && (
                    <div className="info-item">
                      <strong>Proof Uploaded:</strong>
                      <span>{formatDate(registration.paymentProofUploadedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Payment Proof Image */}
                {registration.paymentProof && (
                  <div className="payment-proof-section">
                    <strong>Payment Proof:</strong>
                    <div className="image-container">
                      <img 
                        src={registration.paymentProof} 
                        alt="Payment Proof" 
                        onClick={() => window.open(registration.paymentProof, '_blank')}
                      />
                      <button 
                        className="view-full-btn"
                        onClick={() => window.open(registration.paymentProof, '_blank')}
                      >
                        View Full Size
                      </button>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {registration.paymentRejectionReason && (
                  <div className="rejection-reason">
                    <strong>Rejection Reason:</strong>
                    <p>{registration.paymentRejectionReason}</p>
                  </div>
                )}

                {/* Approval Info */}
                {registration.paymentStatus === 'PAID' && registration.paymentApprovedAt && (
                  <div className="approval-info">
                    <strong>Approved:</strong> {formatDate(registration.paymentApprovedAt)}
                  </div>
                )}
              </div>

              {/* Actions */}
              {registration.paymentStatus === 'PENDING_APPROVAL' && (
                <div className="card-actions">
                  <button 
                    onClick={() => handleApprove(registration._id)}
                    className="btn-approve"
                    disabled={processingId === registration._id}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    onClick={() => openRejectModal(registration)}
                    className="btn-reject"
                    disabled={processingId === registration._id}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showModal && selectedRegistration && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Payment</h2>
            
            <div className="modal-body">
              <p><strong>Participant:</strong> {selectedRegistration.participant?.firstName} {selectedRegistration.participant?.lastName}</p>
              <p><strong>Amount:</strong> ₹{selectedRegistration.amountPaid}</p>

              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection (e.g., unclear image, wrong amount, invalid proof)"
                  rows={4}
                  required
                />
                <small>Minimum 5 characters. Participant will see this message.</small>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleReject}
                className="btn-reject"
                disabled={processingId === selectedRegistration._id}
              >
                Confirm Rejection
              </button>
              <button onClick={() => setShowModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentApprovals;
