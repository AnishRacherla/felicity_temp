/**
 * PASSWORD RESET REQUESTS PAGE (Admin)
 * 
 * View and manage organizer password reset requests
 * - View all requests
 * - Approve/reject requests
 * - Track request history
 */

import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './PasswordResetRequests.css';

function PasswordResetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPasswordResetRequests();
      setRequests(response.data.requests || []);
    } catch (err) {
      setError('Failed to load password reset requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, comments) => {
    try {
      setProcessingId(requestId);
      const response = await adminAPI.approvePasswordResetRequest(requestId, { 
        adminComments: comments 
      });
      
      setNewPassword(response.data.newPassword);
      await fetchRequests();
      
      alert(`✅ Request approved! New password: ${response.data.newPassword}\nPlease share this with the organizer.`);
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId, comments) => {
    if (!comments || comments.trim().length < 5) {
      alert('Please provide a reason for rejection (minimum 5 characters)');
      return;
    }

    try {
      setProcessingId(requestId);
      await adminAPI.rejectPasswordResetRequest(requestId, { 
        adminComments: comments 
      });
      
      await fetchRequests();
      alert('✅ Request rejected');
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (request, action) => {
    setSelectedRequest({ ...request, action });
    setAdminComments('');
    setShowModal(true);
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status.toLowerCase() === filter.toLowerCase();
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
    <div className="password-reset-requests">
      <div className="page-header">
        <h1>Password Reset Requests</h1>
        <p>Review and manage organizer password reset requests</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending ({requests.filter(r => r.status === 'PENDING').length})
        </button>
        <button 
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved ({requests.filter(r => r.status === 'APPROVED').length})
        </button>
        <button 
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({requests.filter(r => r.status === 'REJECTED').length})
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="no-data">No password reset requests found</div>
      ) : (
        <div className="requests-list">
          {filteredRequests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="organizer-info">
                  <h3>{request.organizer?.organizerName || 'Unknown Organizer'}</h3>
                  <span className="category-badge">{request.organizer?.category}</span>
                  <span className={`status-badge ${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </div>
                <div className="request-date">
                  {formatDate(request.createdAt)}
                </div>
              </div>

              <div className="request-body">
                <div className="field">
                  <strong>Email:</strong> {request.organizer?.email}
                </div>
                <div className="field">
                  <strong>Reason:</strong>
                  <p className="reason-text">{request.reason}</p>
                </div>

                {request.status !== 'PENDING' && (
                  <>
                    {request.adminComments && (
                      <div className="field">
                        <strong>Admin Comments:</strong>
                        <p>{request.adminComments}</p>
                      </div>
                    )}
                    {request.processedBy && (
                      <div className="field">
                        <strong>Processed By:</strong> {request.processedBy.firstName} {request.processedBy.lastName}
                        {' on '}{formatDate(request.processedAt)}
                      </div>
                    )}
                  </>
                )}
              </div>

              {request.status === 'PENDING' && (
                <div className="request-actions">
                  <button 
                    onClick={() => openModal(request, 'approve')}
                    className="btn-approve"
                    disabled={processingId === request._id}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    onClick={() => openModal(request, 'reject')}
                    className="btn-reject"
                    disabled={processingId === request._id}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedRequest.action === 'approve' ? 'Approve' : 'Reject'} Password Reset Request
            </h2>
            
            <div className="modal-body">
              <p><strong>Organizer:</strong> {selectedRequest.organizer?.organizerName}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>

              <div className="form-group">
                <label>Admin Comments {selectedRequest.action === 'reject' && '*'}</label>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  placeholder={selectedRequest.action === 'approve' 
                    ? 'Optional comments' 
                    : 'Reason for rejection (required)'}
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  if (selectedRequest.action === 'approve') {
                    handleApprove(selectedRequest._id, adminComments);
                  } else {
                    handleReject(selectedRequest._id, adminComments);
                  }
                }}
                className={selectedRequest.action === 'approve' ? 'btn-approve' : 'btn-reject'}
              >
                Confirm {selectedRequest.action === 'approve' ? 'Approval' : 'Rejection'}
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

export default PasswordResetRequests;
