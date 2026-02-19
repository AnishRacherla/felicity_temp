/**
 * ORGANIZER DASHBOARD
 * 
 * For club heads/organizers to:
 * - View their created events
 * - Create new events
 * - See event statistics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {//basically converts the strong stored in databaase to json date format (human readable)
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePublishEvent = async (eventId) => {
    if (!confirm('Publish this event? It will become visible to all participants.')) return;
    
    try {
      await organizerAPI.publishEvent(eventId);
      alert('✅ Event published successfully!');
      fetchDashboard(); // Refresh data
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to publish event');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#e5e7eb' }}>Organizer Dashboard</h1>
        <p style={{ color: '#9ca3af' }}>Welcome, {user?.organizerName}!</p>
      </div>

      {/* Stats Cards */}
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4f46e5' }}>{dashboard.stats?.totalEvents || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Total Events</div>
          </div>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{dashboard.stats?.publishedEvents || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Published</div>
          </div>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{dashboard.stats?.totalRegistrations || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Total Registrations</div>
          </div>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>{dashboard.stats?.pendingPayments || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Pending Approvals</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
        <button
          onClick={() => navigate('/organizer/create-event')}
          style={{
            background: '#4f46e5',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          ➕ Create New Event
        </button>
        <button
          onClick={() => navigate('/organizer/events')}
          style={{
            background: '#10b981',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          📋 Manage My Events
        </button>
      </div>

      {/* Recent Events */}
      {dashboard?.events && dashboard.events.length > 0 && (
        <div>
          <h2 style={{ color: '#e5e7eb' }}>Recent Events</h2>
          <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
            {dashboard.events.map((event) => (
              <div
                key={event._id}
                style={{
                  background: '#1a2332',
                  border: '1px solid rgba(139, 157, 255, 0.2)',
                  padding: '20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s'
                }}
                onClick={() => navigate(`/organizer/events/${event._id}/details`)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <span style={{
                        background: event.status === 'PUBLISHED' ? '#d1fae5' : '#fee2e2',
                        color: event.status === 'PUBLISHED' ? '#065f46' : '#991b1b',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {event.status}
                      </span>
                      <span style={{
                        background: '#e0e7ff',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {event.eventType}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#e5e7eb' }}>{event.eventName}</h3>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0' }}>
                      📅 {formatDate(event.eventStartDate)}
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0' }}>
                      👥 {event.currentRegistrations || 0} / {event.registrationLimit || '∞'} registrations
                    </p>
                    {event.registrationFee > 0 && (
                      <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0' }}>
                        💰 ₹{event.registrationFee}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {event.status === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublishEvent(event._id);
                        }}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        🚀 Publish
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/organizer/events/${event._id}/details`);
                      }}
                      style={{
                        background: '#f3f4f6',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dashboard?.events && dashboard.events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1a2332', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
          <h3 style={{ color: '#e5e7eb' }}>No Events Yet</h3>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Create your first event to get started!</p>
          <button
            onClick={() => navigate('/organizer/create-event')}
            style={{
              background: '#4f46e5',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Create Event
          </button>
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;
