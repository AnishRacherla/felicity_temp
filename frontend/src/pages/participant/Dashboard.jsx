/**
 * PARTICIPANT DASHBOARD - Main page for participants
 * 
 * Shows:
 * - Upcoming events you're registered for
 * - Quick stats
 * - Quick links to browse events
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  /**
   * FETCH DASHBOARD DATA
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all registrations
        const response = await participantAPI.getMyRegistrations();
        console.log('Dashboard data:', response.data); // Debug log
        const registrations = response.data.registrations || [];

        // Calculate stats
        const now = new Date();
        const upcoming = registrations.filter(r => 
          r.status === 'CONFIRMED' && 
          r.event?.eventStartDate && 
          new Date(r.event.eventStartDate) > now
        );
        
        const completed = registrations.filter(r => r.attended || 
          (r.event?.eventEndDate && new Date(r.event.eventEndDate) < now)
        );

        setStats({
          total: registrations.length,
          upcoming: upcoming.length,
          completed: completed.length
        });

        setUpcomingEvents(upcoming.slice(0, 3)); // Show first 3
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.code === 'ERR_NETWORK') {
          console.error('⚠️ Backend server not running. Start it with: cd backend && npm run dev');
        }
        // Set empty states on error
        setStats({ total: 0, upcoming: 0, completed: 0 });
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * FORMAT DATE
   */
  const formatDate = (dateString) => {
    const options = { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome back, {user?.firstName}! 👋</h1>
        <p>Here's what's happening with your events</p>
      </div>
      
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Upcoming Events</h3>
            <p className="stat-number">{stats.upcoming}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>Completed Events</h3>
            <p className="stat-number">{stats.completed}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎟️</div>
          <div className="stat-content">
            <h3>Total Registrations</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="upcoming-section">
          <h2>Your Upcoming Events</h2>
          <div className="events-list">
            {upcomingEvents.map((registration) => (
              <div 
                key={registration._id} 
                className="event-item"
                onClick={() => navigate(`/events/${registration.event._id}`)}
              >
                <div className="event-info">
                  <h3>{registration.event.eventName}</h3>
                  <p className="event-date">
                    📅 {formatDate(registration.event.eventStartDate)}
                  </p>
                  <p className="ticket-id">Ticket: {registration.ticketId}</p>
                </div>
                <button className="view-btn">View Details →</button>
              </div>
            ))}
          </div>
          <button 
            className="view-all-btn"
            onClick={() => navigate('/registrations')}
          >
            View All Registrations
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/browse-events')}
          >
            <span className="action-icon">🔍</span>
            <span className="action-text">Browse Events</span>
          </button>
          
          <button 
            className="action-card"
            onClick={() => navigate('/registrations')}
          >
            <span className="action-icon">🎟️</span>
            <span className="action-text">My Tickets</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && stats.total === 0 && (
        <div className="empty-state">
          <h3>No registrations yet!</h3>
          <p>Start exploring events and register for the ones you like</p>
          <button 
            className="browse-btn"
            onClick={() => navigate('/browse-events')}
          >
            Browse Events
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
