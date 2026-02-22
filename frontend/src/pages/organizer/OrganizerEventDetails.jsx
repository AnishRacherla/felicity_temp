import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerAPI, discussionAPI } from '../../services/api';
import './OrganizerEventDetails.css';

//for the view button

function OrganizerEventDetails() {
  const { id } = useParams();//in built functions
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await organizerAPI.getEventDetails(id);
      setEvent(response.data.event);
      
      // Check for new messages
      try {
        const discussionRes = await discussionAPI.getEventDiscussions(id);
        const currentCount = discussionRes.data.discussions?.length || 0;
        const lastSeenCount = parseInt(localStorage.getItem(`discussion_organizer_${id}_count`) || '0');
        if (currentCount > lastSeenCount) {
          setNewMessagesCount(currentCount - lastSeenCount);
        }
      } catch (err) {
        // Ignore error
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.response?.data?.message || 'Failed to load event details');
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = filter !== 'ALL' ? { status: filter } : {};
      const response = await organizerAPI.getEventRegistrations(id, params);
      setRegistrations(response.data.registrations || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err.response?.data?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event) {
      fetchRegistrations();
    }
  }, [filter]);

  const handleExportCSV = async () => {
    try {
      const response = await organizerAPI.exportRegistrations(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.eventName}_registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting registrations:', err);
      alert('Failed to export registrations');
    }
  };

  const handleApprovePayment = async (registrationId) => {
    try {
      await organizerAPI.approveMerchandisePayment(registrationId);
      alert('Payment approved successfully!');
      // Refetch both registrations and event details to update stock
      await fetchEventDetails();
      fetchRegistrations();
    } catch (err) {
      console.error('Error approving payment:', err);
      alert(err.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (registrationId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await organizerAPI.rejectMerchandisePayment(registrationId, { reason });
      alert('Payment rejected');
      // Refetch both registrations and event details
      await fetchEventDetails();
      fetchRegistrations();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert(err.response?.data?.message || 'Failed to reject payment');
    }
  };

  if (loading && !event) {
    return <div className="organizer-event-details-container"><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="organizer-event-details-container">
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/organizer/events')}>Back to Events</button>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  // Calculate analytics
  const totalRegistrations = registrations.length;
  const confirmedRegistrations = registrations.filter(r => r.status === 'CONFIRMED').length;
  const pendingPayments = registrations.filter(r => r.paymentStatus === 'PENDING').length;
  const totalRevenue = registrations
    .filter(r => r.paymentStatus === 'COMPLETED')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const attendanceRate = event.registrationLimit 
    ? ((totalRegistrations / event.registrationLimit) * 100).toFixed(1)
    : 'N/A';

  return (
    <div className="organizer-event-details-container">
      {/* Header */}
      <div className="event-header">
        <button onClick={() => navigate('/organizer/events')} className="back-button">
          ← Back to Events
        </button>
        <h1>{event.eventName}</h1>
        <div className="event-badges">
          <span className={`status-badge ${event.status.toLowerCase()}`}>
            {event.status}
          </span>
          <span className="type-badge">{event.eventType}</span>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="analytics-grid">
        <div className="stat-card">
          <h3>Total Registrations</h3>
          <p className="stat-value">{totalRegistrations}</p>
          <p className="stat-label">
            {event.registrationLimit ? `of ${event.registrationLimit} limit` : 'No limit'}
          </p>
        </div>

        <div className="stat-card">
          <h3>Attendance Rate</h3>
          <p className="stat-value">{attendanceRate}%</p>
          <p className="stat-label">Registration capacity</p>
        </div>

        <div className="stat-card">
          <h3>Confirmed</h3>
          <p className="stat-value">{confirmedRegistrations}</p>
          <p className="stat-label">Confirmed registrations</p>
        </div>

        <div className="stat-card">
          <h3>Revenue</h3>
          <p className="stat-value">₹{totalRevenue}</p>
          <p className="stat-label">
            {pendingPayments} pending payment{pendingPayments !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Event Details */}
      <div className="event-info-section">
        <h2>Event Details</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Description:</strong>
            <p>{event.description}</p>
          </div>
          <div className="info-item">
            <strong>Dates:</strong>
            <p>
              {new Date(event.eventStartDate).toLocaleDateString()} - {' '}
              {new Date(event.eventEndDate).toLocaleDateString()}
            </p>
          </div>
          <div className="info-item">
            <strong>Venue:</strong>
            <p>{event.venue || 'Not specified'}</p>
          </div>
          <div className="info-item">
            <strong>Registration Fee:</strong>
            <p>₹{event.registrationFee || 0}</p>
          </div>
          <div className="info-item">
            <strong>Eligibility:</strong>
            <p>{event.eligibility || 'All'}</p>
          </div>
          {event.tags && event.tags.length > 0 && (
            <div className="info-item">
              <strong>Tags:</strong>
              <div className="tags">
                {event.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Merchandise Stock Information */}
      {event.eventType === 'MERCHANDISE' && event.merchandise && (
        <div className="event-info-section">
          <h2>📦 Merchandise Stock Availability</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Total Stock:</strong>
              <p>{event.merchandise.stockQuantity || 0} units</p>
            </div>
            {event.merchandise.variants && event.merchandise.variants.length > 0 && (
              <div className="info-item" style={{gridColumn: '1 / -1'}}>
                <strong>Stock by Variant:</strong>
                <table style={{width: '100%', marginTop: '10px', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr>
                      <th style={{textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd'}}>Size</th>
                      <th style={{textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd'}}>Color</th>
                      <th style={{textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd'}}>Stock</th>
                      <th style={{textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd'}}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.merchandise.variants.map((variant, index) => {
                      const effectiveStock = variant.stock || (() => {
                        const numVariants = event.merchandise.variants.length;
                        const baseStock = Math.floor((event.merchandise.stockQuantity || 0) / numVariants);
                        const remainder = (event.merchandise.stockQuantity || 0) % numVariants;
                        return index < remainder ? baseStock + 1 : baseStock;
                      })();
                      const stockClass = effectiveStock > 5 ? 'in-stock' : effectiveStock > 0 ? 'low-stock' : 'out-of-stock';
                      return (
                        <tr key={index}>
                          <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{variant.size || 'N/A'}</td>
                          <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{variant.color || 'N/A'}</td>
                          <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{effectiveStock} units</td>
                          <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>
                            <span className={`status-badge ${stockClass}`}>
                              {effectiveStock > 5 ? '✓ In Stock' : effectiveStock > 0 ? '⚠ Low Stock' : '✗ Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registrations Section */}
      <div className="registrations-section">
        <div className="registrations-header">
          <h2>Registrations ({totalRegistrations})</h2>
          <div className="registrations-actions">
            <div className="filter-buttons">
              {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={filter === filterOption ? 'active' : ''}
                >
                  {filterOption}
                </button>
              ))}
            </div>
            <div className="action-buttons-group">
              <button 
                onClick={() => {
                  // Mark as seen
                  discussionAPI.getEventDiscussions(id).then(res => {
                    const count = res.data.discussions?.length || 0;
                    localStorage.setItem(`discussion_organizer_${id}_count`, count.toString());
                  });
                  navigate(`/events/${id}/discussion`);
                }} 
                className="discussion-button"
                title="Moderate event discussion forum"
              >
                💬 Manage Discussion
                {newMessagesCount > 0 && (
                  <span className="notification-badge">{newMessagesCount}</span>
                )}
              </button>
              <button 
                onClick={() => navigate(`/organizer/events/${id}/payment-approvals`)} 
                className="payment-approvals-button"
              >
                💳 Payment Approvals
              </button>
              <button 
                onClick={() => navigate(`/organizer/events/${id}/feedback`)} 
                className="feedback-button"
              >
                ⭐ View Feedback
              </button>
              {registrations.length > 0 && (
                <button onClick={handleExportCSV} className="export-button">
                  📊 Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading registrations...</p>
        ) : registrations.length === 0 ? (
          <div className="empty-state">
            <p>No registrations yet</p>
          </div>
        ) : (
          <div className="registrations-table">
            <table>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  {event.eventType === 'MERCHANDISE' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration._id}>
                    <td>
                      {registration.participant?.firstName} {registration.participant?.lastName}
                    </td>
                    <td>{registration.participant?.email}</td>
                    <td>{new Date(registration.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${registration.status.toLowerCase()}`}>
                        {registration.status}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-badge ${registration.paymentStatus?.toLowerCase()}`}>
                        {registration.paymentStatus || 'N/A'}
                      </span>
                      {registration.amount && <span> - ₹{registration.amount}</span>}
                    </td>
                    {event.eventType === 'MERCHANDISE' && (
                      <td>
                        {registration.paymentStatus === 'PENDING' && (
                          <div className="action-buttons">
                            <button
                              onClick={() => handleApprovePayment(registration._id)}
                              className="approve-button"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(registration._id)}
                              className="reject-button"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizerEventDetails;
