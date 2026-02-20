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

  const isUpcomingOrOngoing = (event) => {
    const now = new Date();
    const eventEnd = new Date(event.eventEndDate);
    return eventEnd >= now;
  };

  const featuredEvents = events.filter(isUpcomingOrOngoing).slice(0, 3);

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
          <div className="spinner-icon">⏳</div>
          <p>Loading amazing events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="no-events">
          <div className="no-events-icon">🎭</div>
          <h3>No Events Found</h3>
          <p>Try adjusting your filters or check back later for new events!</p>
        </div>
      ) : (
        <>
          {/* Featured Events Section */}
          {featuredEvents.length > 0 && (
            <div className="featured-section">
              <h2 className="section-title">🌟 Featured Events</h2>
              <div className="featured-grid">
                {featuredEvents.map((event) => (
                  <div 
                    key={event._id} 
                    className="featured-card"
                    onClick={() => handleEventClick(event._id)}
                  >
                    <div className="featured-card-gradient"></div>
                    <div className="featured-content">
                      <div className="featured-badges">
                        <span className={`featured-badge ${event.eventType.toLowerCase()}`}>
                          {event.eventType}
                        </span>
                      </div>
                      
                      <h3 className="featured-title">{event.eventName}</h3>
                      
                      <p className="featured-description">
                        {event.description.substring(0, 120)}
                        {event.description.length > 120 && '...'}
                      </p>

                      <div className="featured-organizer">
                        <span className="organizer-icon">🎯</span>
                        <span className="organizer-name">
                          {event.organizer?.organizerName || 'Unknown'}
                        </span>
                        {event.organizer?.category && (
                          <span className="organizer-category"> • {event.organizer.category}</span>
                        )}
                      </div>

                      <div className="featured-footer">
                        <div className="featured-info">
                          <span className="info-icon">📅</span>
                          <span>{formatDate(event.eventStartDate)}</span>
                        </div>
                        {event.registrationFee > 0 ? (
                          <div className="featured-price">₹{event.registrationFee}</div>
                        ) : (
                          <div className="featured-free">FREE</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Events Section */}
          <div className="all-events-section">
            <h2 className="section-title">📚 All Events ({events.length})</h2>
            <div className="events-modern-grid">
              {events.map((event) => (
                <div 
                  key={event._id} 
                  className="modern-event-card"
                  onClick={() => handleEventClick(event._id)}
                >
                  <div className="card-header">
                    <div className="card-badges">
                      <span className={`modern-badge ${event.eventType.toLowerCase()}`}>
                        {event.eventType}
                      </span>
                    </div>
                    <div className="card-eligibility">
                      {event.eligibility.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{event.eventName}</h3>
                    
                    <p className="card-description">
                      {event.description.substring(0, 90)}
                      {event.description.length > 90 && '...'}
                    </p>

                    <div className="card-organizer-info">
                      <span className="org-label">Organized by</span>
                      <span className="org-name">
                        {event.organizer?.organizerName || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="footer-details">
                      <div className="detail-box">
                        <span className="detail-icon">📅</span>
                        <span className="detail-text">{formatDate(event.eventStartDate)}</span>
                      </div>
                      
                      {event.registrationLimit && (
                        <div className="detail-box">
                          <span className="detail-icon">👥</span>
                          <span className="detail-text">
                            {event.currentRegistrations}/{event.registrationLimit}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="footer-price">
                      {event.registrationFee > 0 ? (
                        <span className="price-amount">₹{event.registrationFee}</span>
                      ) : (
                        <span className="price-free">FREE</span>
                      )}
                    </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="card-tags">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="modern-tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BrowseEvents;
