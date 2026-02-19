/**
 * BROWSE EVENTS PAGE - List all available events
 * 
 * Features:
 * - Search events by name
 * - Filter by type, date, eligibility
 * - See trending events
 * - Click event to view details and register
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './BrowseEvents.css';

function BrowseEvents() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user to check auth state
  
  // State
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [eligibility, setEligibility] = useState('');

  /**
   * FETCH EVENTS
   * Get all events from backend with filters
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Build query params
      const params = {};
      if (search) params.search = search;
      if (eventType) params.eventType = eventType;
      if (eligibility) params.eligibility = eligibility;
      
      const response = await eventAPI.browseEvents(params);
      console.log('Events fetched:', response.data); // Debug log
      setEvents(response.data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError('⚠️ Cannot connect to server. Please make sure:\n1. Backend server is running (npm run dev in backend folder)\n2. Server is running on http://localhost:5000');
      } else {
        setError(err.response?.data?.message || 'Failed to load events. Please try again.');
      }
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH TRENDING EVENTS
   */
  const fetchTrendingEvents = async () => {
    try {
      const response = await eventAPI.getTrendingEvents();
      setTrendingEvents(response.data.events || []);
    } catch (err) {
      console.error('Failed to fetch trending events:', err);
    }
  };

  // Load events on mount and when filters change
  useEffect(() => {
    console.log('BrowseEvents: User state:', user);
    console.log('BrowseEvents: Token in localStorage:', localStorage.getItem('token'));
    fetchEvents();
  }, [search, eventType, eligibility]);//runs this function whenever the search, eventType, or eligibility state changes. This allows the component to fetch new events from the backend based on the updated filter criteria whenever the user modifies any of these filters.

  // Load trending events on mount
  useEffect(() => {
    fetchTrendingEvents();
  }, []);

  /**
   * HANDLE SEARCH
   */
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  /**
   * HANDLE EVENT CLICK
   * Navigate to event details page
   */
  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  /**
   * FORMAT DATE
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    const dateStr = date.toLocaleDateString('en-IN', options);
    const timeStr = date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <div className="browse-events">
      {/* Header */}
      <div className="page-header">
        <h1>Browse Events</h1>
        <p>Discover amazing events at Felicity!</p>
      </div>

      {/* Trending Events Section */}
      {trendingEvents.length > 0 && (
        <div className="trending-section">
          <h2>🔥 Trending Now</h2>
          <div className="trending-grid">
            {trendingEvents.map((event) => (
              <div 
                key={event._id} 
                className="trending-card"
                onClick={() => handleEventClick(event._id)}
              >
                <span className="trending-badge">TRENDING</span>
                <h3>{event.eventName}</h3>
                <p className="organizer">by {event.organizer?.organizerName}</p>
                <p className="date">{formatDate(event.eventStartDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="🔍 Search for events..." 
            className="search-input"
            value={search}
            onChange={handleSearch}
          />
        </div>

        <div className="filters">
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="NORMAL">Normal Events</option>
            <option value="MERCHANDISE">Merchandise</option>
          </select>

          <select 
            value={eligibility} 
            onChange={(e) => setEligibility(e.target.value)}
            className="filter-select"
          >
            <option value="">All Participants</option>
            <option value="IIIT_ONLY">IIIT Only</option>
            <option value="NON_IIIT_ONLY">Non-IIIT Only</option>
            <option value="ALL">Everyone</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="loading-spinner">
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="no-events">
          <p>No events found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div 
              key={event._id} 
              className="event-card"
              onClick={() => handleEventClick(event._id)}
            >
              {/* Event Type Badge */}
              <div className="event-badges">
                <span className={`badge ${event.eventType.toLowerCase()}`}>
                  {event.eventType}
                </span>
                <span className="badge eligibility">
                  {event.eligibility.replace('_', ' ')}
                </span>
              </div>

              {/* Event Content */}
              <h3 className="event-name">{event.eventName}</h3>
              
              <p className="event-description">
                {event.description.substring(0, 100)}
                {event.description.length > 100 && '...'}
              </p>

              {/* Organizer */}
              <p className="event-organizer">
                by {event.organizer?.organizerName || 'Unknown'}
                {event.organizer?.category && ` • ${event.organizer.category}`}
              </p>

              {/* Event Details */}
              <div className="event-details">
                <div className="detail-item">
                  <span className="icon">📅</span>
                  <span>{formatDate(event.eventStartDate)}</span>
                </div>
                
                {event.registrationFee > 0 && (
                  <div className="detail-item fee">
                    <span className="icon">₹</span>
                    <span>₹{event.registrationFee}</span>
                  </div>
                )}

                {event.registrationLimit && (
                  <div className="detail-item">
                    <span className="icon">👥</span>
                    <span>{event.currentRegistrations}/{event.registrationLimit}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="event-tags">
                  {event.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BrowseEvents;
