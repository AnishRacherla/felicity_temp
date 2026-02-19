/**
 * MANAGE EVENTS PAGE
 * 
 * Full event management interface for organizers:
 * - View all events with filters
 * - Publish/unpublish events
 * - Edit/delete events
 * - View registrations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';

function ManageEvents() {
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DRAFT, PUBLISHED, COMPLETED

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = filter !== 'ALL' ? { status: filter } : {};
      const response = await organizerAPI.getMyEvents(params);//drafts ,completed ,published
      setEvents(response.data.events);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (eventId) => {
    if (!confirm('Publish this event? It will become visible to all participants.')) return;
    
    try {
      await organizerAPI.publishEvent(eventId);
      alert('✅ Event published successfully!');
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to publish event');
    }
  };

  const handleComplete = async (eventId) => {
    if (!confirm('Mark this event as completed? This will close registrations and finalize statistics.')) return;
    
    try {
      await organizerAPI.completeEvent(eventId);
      alert('✅ Event marked as completed!');
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete event');
    }
  };

  const handleDelete = async (eventId, eventName) => {
    if (!confirm(`Delete "${eventName}"? This action cannot be undone.`)) return;
    
    try {
      await organizerAPI.deleteEvent(eventId);
      alert('✅ Event deleted successfully!');
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading events...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#e5e7eb' }}>Manage My Events</h1>
        <p style={{ color: '#9ca3af' }}>View and manage all your events</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
        {['ALL', 'DRAFT', 'PUBLISHED', 'COMPLETED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              color: filter === status ? '#4f46e5' : '#9ca3af',
              borderBottom: filter === status ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: '-2px'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Create Event Button */}
      <div style={{ marginBottom: '30px' }}>
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
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1a2332', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
          <h3 style={{ color: '#e5e7eb' }}>No Events Found</h3>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
            {filter === 'ALL' ? 'Create your first event to get started!' : `No ${filter.toLowerCase()} events yet.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {events.map((event) => (
            <div
              key={event._id}
              style={{
                background: '#1a2332',
                border: '1px solid rgba(139, 157, 255, 0.2)',
                padding: '25px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                {/* Event Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <span style={{
                      background: event.status === 'PUBLISHED' ? '#d1fae5' : event.status === 'COMPLETED' ? '#ddd6fe' : '#fee2e2',
                      color: event.status === 'PUBLISHED' ? '#065f46' : event.status === 'COMPLETED' ? '#5b21b6' : '#991b1b',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {event.status}
                    </span>
                    <span style={{
                      background: '#e0e7ff',
                      color: '#4338ca',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {event.eventType}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#e5e7eb' }}>{event.eventName}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', color: '#9ca3af', fontSize: '14px' }}>
                    <div>📅 Start: {formatDate(event.eventStartDate)}</div>
                    <div>🏁 End: {formatDate(event.eventEndDate)}</div>
                    <div>👥 Registrations: {event.currentRegistrations || 0} / {event.registrationLimit || '∞'}</div>
                    <div>💰 Fee: {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</div>
                    <div>⏰ Deadline: {formatDate(event.registrationDeadline)}</div>
                    <div>👁️ Views: {event.views || 0}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px', flexWrap: 'wrap' }}>
                  {event.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(event._id)}
                      style={{
                        background: 'rgba(139, 157, 255, 0.15)',
                        color: '#8b9dff',
                        border: '1px solid rgba(139, 157, 255, 0.3)',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      🚀 Publish
                    </button>
                  )}

                  {event.status === 'PUBLISHED' && new Date(event.eventEndDate) < new Date() && (
                    <button
                      onClick={() => handleComplete(event._id)}
                      style={{
                        background: '#374151',
                        color: '#e5e7eb',
                        border: '1px solid #4b5563',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ✅ Complete
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/organizer/events/${event._id}/edit`)}
                    style={{
                      background: '#374151',
                      color: '#e5e7eb',
                      border: '1px solid #4b5563',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => navigate(`/organizer/events/${event._id}/details`)}
                    style={{
                      background: 'rgba(139, 157, 255, 0.15)',
                      color: '#8b9dff',
                      border: '1px solid rgba(139, 157, 255, 0.3)',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📊 View
                  </button>

                  <button
                    onClick={() => handleDelete(event._id, event.eventName)}
                    style={{
                      background: '#374151',
                      color: '#e5e7eb',
                      border: '1px solid #4b5563',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageEvents;
