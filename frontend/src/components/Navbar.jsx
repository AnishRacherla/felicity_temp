/**
 * NAVBAR COMPONENT - Navigation bar shown at top of every page
 * 
 * Shows different links based on:
 * - Whether user is logged in
 * - What role the user has (participant, organizer, admin)
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();  // Get user and logout function from context
  const navigate = useNavigate();

  /**
   * HANDLE LOGOUT
   * Log out user and redirect to login page
   */
  const handleLogout = () => {
    logout();              // Clear auth state
    navigate('/login');    // Go to login page
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
                </>
              )}

              {user.role === 'organizer' && (
                <>
                  <Link to="/organizer/dashboard">Dashboard</Link>
                  <Link to="/organizer/create-event">Create Event</Link>
                  <Link to="/organizer/events">My Events</Link>
                  <Link to="/organizer/scan-tickets">Scan Tickets</Link>
                  <Link to="/organizer/profile">Profile</Link>
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
