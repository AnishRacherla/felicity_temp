/**
 * NAVBAR COMPONENT - Navigation bar shown at top of every page
 * 
 * Shows different links based on:
 * - Whether user is logged in
 * - What role the user has (participant, organizer, admin)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { participantAPI, organizerAPI, discussionAPI } from '../services/api';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();  // Get user and logout function from context
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  /**
   * HANDLE LOGOUT
   * Log out user and redirect to login page
   */
  const handleLogout = () => {
    logout();              // Clear auth state
    navigate('/login');    // Go to login page
  };

  /**
   * FETCH NOTIFICATIONS (for participants only)
   */
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      if (user.role === 'participant') {
        try {
          const response = await participantAPI.getMyRegistrations();
          const registrations = response.data.registrations || [];
          
          const notificationsList = [];
          
          for (const reg of registrations) {
            if (reg.status === 'CONFIRMED' && reg.event?._id) {
              try {
                const eventId = reg.event._id;
                const res = await discussionAPI.getEventDiscussions(eventId);
                const currentCount = res.data.discussions?.length || 0;
                const lastSeenCount = parseInt(localStorage.getItem(`discussion_${eventId}_count`) || '0');
                
                if (currentCount > lastSeenCount) {
                  notificationsList.push({
                    eventId: eventId,
                    eventName: reg.event.eventName,
                    count: currentCount - lastSeenCount,
                    eventImage: reg.event.eventImage,
                    type: 'message'
                  });
                }
              } catch (err) {
                console.log('Failed to fetch notifications for event:', reg.event._id);
              }
            }
          }
          
          setNotifications(notificationsList);
        } catch (err) {
          console.log('Failed to fetch notifications:', err);
        }
      } else if (user.role === 'organizer') {
        try {
          const response = await organizerAPI.getDashboard();
          const pendingCount = response.data?.stats?.pendingPayments || 0;
          
          if (pendingCount > 0) {
            setNotifications([{
              type: 'payment_approval',
              count: pendingCount,
              message: `${pendingCount} payment${pendingCount > 1 ? 's' : ''} awaiting approval`
            }]);
          } else {
            setNotifications([]);
          }
        } catch (err) {
          console.log('Failed to fetch notifications:', err);
        }
      }
    };
    
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  /**
   * CLOSE DROPDOWN WHEN CLICKING OUTSIDE
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * CALCULATE TOTAL UNREAD COUNT
   */
  const totalUnreadCount = notifications.reduce((sum, notif) => sum + notif.count, 0);

  /**
   * HANDLE NOTIFICATION CLICK
   */
  const handleNotificationClick = (notification) => {
    setShowDropdown(false);
    
    if (notification.type === 'message' && notification.eventId) {
      // Participant message notification - go to event details
      navigate(`/event/${notification.eventId}`);
    } else if (notification.type === 'payment_approval') {
      // Organizer payment approval notification - go to organizer events page
      navigate('/organizer/events');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo / Brand */}
        <Link to="/" className="navbar-brand">
          Felicity
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">
          {user ? (
            // Logged in - Show user-specific links
            <>
              {user.role === 'participant' && (
                <>
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/browse-events">Browse Events</Link>
                  <Link to="/clubs">Clubs</Link>
                  <Link to="/registrations">My Registrations</Link>
                  <Link to="/follow-organizers">Follow Organizers</Link>
                  <Link to="/profile">Profile</Link>
                  
                  {/* Notification Bell Icon */}
                  <div className="notification-bell-container" ref={dropdownRef}>
                    <button 
                      className="notification-bell-btn"
                      onClick={() => setShowDropdown(!showDropdown)}
                      title="Notifications"
                    >
                      <span className="bell-icon">🔔</span>
                      {totalUnreadCount > 0 && (
                        <span className="notification-bell-badge">{totalUnreadCount}</span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showDropdown && (
                      <div className="notification-dropdown">
                        <div className="notification-dropdown-header">
                          <h3>Notifications</h3>
                          {totalUnreadCount > 0 && (
                            <span className="unread-count">{totalUnreadCount} new</span>
                          )}
                        </div>
                        
                        <div className="notification-dropdown-content">
                          {notifications.length === 0 ? (
                            <div className="no-notifications">
                              <p>No new notifications</p>
                            </div>
                          ) : (
                            notifications.map((notif, index) => (
                              <div 
                                key={notif.eventId || notif.type || index}
                                className="notification-item"
                                onClick={() => handleNotificationClick(notif)}
                              >
                                {notif.type === 'message' ? (
                                  // Participant message notification
                                  <>
                                    {notif.eventImage && (
                                      <img 
                                        src={notif.eventImage} 
                                        alt={notif.eventName}
                                        className="notification-event-image"
                                      />
                                    )}
                                    <div className="notification-item-content">
                                      <p className="notification-event-name">{notif.eventName}</p>
                                      <p className="notification-message">
                                        {notif.count} new message{notif.count > 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </>
                                ) : notif.type === 'payment_approval' ? (
                                  // Organizer payment approval notification
                                  <>
                                    <div className="notification-icon-wrapper">
                                      <span className="notification-icon">💳</span>
                                    </div>
                                    <div className="notification-item-content">
                                      <p className="notification-event-name">Payment Approvals</p>
                                      <p className="notification-message">
                                        {notif.message}
                                      </p>
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {user.role === 'organizer' && (
                <>
                  <Link to="/organizer/dashboard">Dashboard</Link>
                  <Link to="/organizer/create-event">Create Event</Link>
                  <Link to="/organizer/events">My Events</Link>
                  <Link to="/organizer/scan-tickets">Scan Tickets</Link>
                  <Link to="/organizer/profile">Profile</Link>
                  
                  {/* Notification Bell Icon */}
                  <div className="notification-bell-container" ref={dropdownRef}>
                    <button 
                      className="notification-bell-btn"
                      onClick={() => setShowDropdown(!showDropdown)}
                      title="Notifications"
                    >
                      <span className="bell-icon">🔔</span>
                      {totalUnreadCount > 0 && (
                        <span className="notification-bell-badge">{totalUnreadCount}</span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showDropdown && (
                      <div className="notification-dropdown">
                        <div className="notification-dropdown-header">
                          <h3>Notifications</h3>
                          {totalUnreadCount > 0 && (
                            <span className="unread-count">{totalUnreadCount} new</span>
                          )}
                        </div>
                        
                        <div className="notification-dropdown-content">
                          {notifications.length === 0 ? (
                            <div className="no-notifications">
                              <p>No new notifications</p>
                            </div>
                          ) : (
                            notifications.map((notif, index) => (
                              <div 
                                key={notif.eventId || notif.type || index}
                                className="notification-item"
                                onClick={() => handleNotificationClick(notif)}
                              >
                                {notif.type === 'message' ? (
                                  // Participant message notification
                                  <>
                                    {notif.eventImage && (
                                      <img 
                                        src={notif.eventImage} 
                                        alt={notif.eventName}
                                        className="notification-event-image"
                                      />
                                    )}
                                    <div className="notification-item-content">
                                      <p className="notification-event-name">{notif.eventName}</p>
                                      <p className="notification-message">
                                        {notif.count} new message{notif.count > 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </>
                                ) : notif.type === 'payment_approval' ? (
                                  // Organizer payment approval notification
                                  <>
                                    <div className="notification-icon-wrapper">
                                      <span className="notification-icon">💳</span>
                                    </div>
                                    <div className="notification-item-content">
                                      <p className="notification-event-name">Payment Approvals</p>
                                      <p className="notification-message">
                                        {notif.message}
                                      </p>
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard">Dashboard</Link>
                  <Link to="/admin/manage-organizers">Manage Organizers</Link>
                  <Link to="/admin/password-requests">Password Reset Requests</Link>
                </>
              )}

              <div className="navbar-user">
                <span className="user-name">
                  {user.firstName} {user.lastName}
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            // Not logged in - Show login/register links
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
