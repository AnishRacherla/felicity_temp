/**
 * FOLLOW ORGANIZERS PAGE
 * 
 * View all organizers and follow/unfollow them
 * - Browse all organizers
 * - See organizer details
 * - Follow/unfollow organizers
 * - Track followed organizers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './FollowOrganizers.css';

function FollowOrganizers() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, following

  /**
   * FETCH ORGANIZERS AND PROFILE
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // First fetch organizers
        await fetchOrganizers();
        
        // Then fetch user profile to get followed organizers
        if (user) {
          await fetchUserProfile();
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        // Error is already set in fetchOrganizers
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await participantAPI.getOrganizers();
      const orgs = response.data.organizers || [];
      console.log('Fetched organizers:', orgs);
      setOrganizers(orgs);
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('⚠️ Cannot connect to server. Please make sure backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to load organizers.');
      }
      throw err; // Re-throw to stop execution
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await participantAPI.getProfile();
      console.log('Raw profile response:', response.data);
      
      // API returns 'profile' with populated followedOrganizers
      const followedOrgs = response.data.profile?.followedOrganizers || [];
      console.log('Followed organizers from API:', followedOrgs);
      
      // Extract IDs and convert to strings for reliable comparison
      const followedIds = followedOrgs.map(org => {
        // Handle both populated objects and direct IDs
        if (typeof org === 'string') {
          return org;
        } else if (org._id) {
          return org._id.toString ? org._id.toString() : String(org._id);
        }
        return String(org);
      });
      
      console.log('Processed followed IDs:', followedIds);
      setFollowedOrganizers(followedIds);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  /**
   * TOGGLE FOLLOW/UNFOLLOW
   */
  const handleToggleFollow = async (organizerId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await participantAPI.toggleFollowOrganizer(organizerId);
      
      // Convert to string for consistent comparison
      const orgIdStr = organizerId?.toString ? organizerId.toString() : String(organizerId);
      
      // Update local state based on response
      if (response.data.following) {
        // Now following - add to array if not already there
        if (!followedOrganizers.some(id => {
          const idStr = id?.toString ? id.toString() : String(id);
          return idStr === orgIdStr;
        })) {
          setFollowedOrganizers([...followedOrganizers, orgIdStr]);
          console.log('Added to following:', orgIdStr);
        }
      } else {
        // Unfollowed - remove from array
        setFollowedOrganizers(followedOrganizers.filter(id => {
          const idStr = id?.toString ? id.toString() : String(id);
          return idStr !== orgIdStr;
        }));
        console.log('Removed from following:', orgIdStr);
      }

      // Show success message
      const message = response.data.message || (response.data.following ? 'Followed successfully!' : 'Unfollowed successfully!');
      console.log(message);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      alert(err.response?.data?.message || 'Failed to update following status');
      // Refresh to get correct state on error
      await fetchUserProfile();
    }
  };

  /**
   * CHECK IF FOLLOWING
   */
  const isFollowing = (organizerId) => {
    // Convert both to strings for reliable comparison
    const orgIdStr = organizerId?.toString ? organizerId.toString() : String(organizerId);
    return followedOrganizers.some(id => {
      const followedIdStr = id?.toString ? id.toString() : String(id);
      return followedIdStr === orgIdStr;
    });
  };

  /**
   * FILTER ORGANIZERS
   */
  const filteredOrganizers = organizers.filter(org => {
    if (filter === 'all') return true;
    if (filter === 'following') return isFollowing(org._id);
    return true;
  });

  if (loading) {
    return (
      <div className="follow-organizers">
        <div className="loading-spinner">
          <div className="spinner-icon">⏳</div>
          <p>Loading amazing organizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="follow-organizers">
      {/* Header */}
      <div className="page-header">
        <h1>✨ Follow Organizers</h1>
        <p>Stay connected with your favorite event organizers and never miss their amazing events!</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span className="tab-icon">🌐</span>
          <span className="tab-text">All Organizers</span>
          <span className="tab-count">{organizers.length}</span>
        </button>
        <button 
          className={`tab-button ${filter === 'following' ? 'active' : ''}`}
          onClick={() => setFilter('following')}
        >
          <span className="tab-icon">⭐</span>
          <span className="tab-text">Following</span>
          <span className="tab-count">{followedOrganizers.length}</span>
        </button>
      </div>

      {/* Organizers Content */}
      {filteredOrganizers.length === 0 ? (
        <div className="no-organizers">
          <div className="no-organizers-icon">
            {filter === 'following' ? '⭐' : '🎭'}
          </div>
          <h3>{filter === 'following' ? 'No Followed Organizers' : 'No Organizers Found'}</h3>
          <p>
            {filter === 'following' 
              ? 'Start following organizers to stay updated with their events!' 
              : 'Check back later for new event organizers.'}
          </p>
        </div>
      ) : (
        <>
          {/* Featured/Following Section - Show followed organizers at top */}
          {followedOrganizers.length > 0 && filter === 'all' && (
            <div className="featured-section">
              <h2 className="section-title">⭐ Your Followed Organizers</h2>
              <div className="featured-grid">
                {filteredOrganizers
                  .filter(org => isFollowing(org._id))
                  .slice(0, 3)
                  .map((organizer) => (
                    <div key={organizer._id} className="featured-card">
                      <div className="featured-gradient"></div>
                      
                      <div className="featured-avatar">
                        <div className="avatar-circle">
                          {organizer.organizerName?.charAt(0).toUpperCase() || 'O'}
                        </div>
                      </div>

                      <div className="featured-content">
                        <h3 className="featured-name">{organizer.organizerName || 'Unknown Organizer'}</h3>
                        
                        {organizer.category && (
                          <span className="featured-badge">{organizer.category}</span>
                        )}

                        {organizer.description && (
                          <p className="featured-description">
                            {organizer.description.length > 100 
                              ? organizer.description.substring(0, 100) + '...'
                              : organizer.description}
                          </p>
                        )}

                        <div className="featured-info">
                          {organizer.firstName && (
                            <div className="info-row">
                              <span className="info-icon">👤</span>
                              <span className="info-text">
                                {organizer.firstName} {organizer.lastName}
                              </span>
                            </div>
                          )}
                          {organizer.contactEmail && (
                            <div className="info-row">
                              <span className="info-icon">📧</span>
                              <span className="info-text">{organizer.contactEmail}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleToggleFollow(organizer._id)}
                          className="featured-follow-btn following"
                        >
                          ✓ Following
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Organizers Grid */}
          <div className="all-organizers-section">
            <h2 className="section-title">
              {filter === 'following' ? '⭐ Following' : '🌐 All Organizers'} 
              ({filteredOrganizers.length})
            </h2>
            
            <div className="organizers-modern-grid">
              {filteredOrganizers.map((organizer) => (
                <div key={organizer._id} className="modern-organizer-card">
                  {/* Card Header with Avatar */}
                  <div className="card-header">
                    <div className="modern-avatar">
                      {organizer.organizerName?.charAt(0).toUpperCase() || 'O'}
                    </div>
                    {isFollowing(organizer._id) && (
                      <div className="following-indicator">
                        <span>⭐ Following</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    <h3 className="card-org-name">
                      {organizer.organizerName || 'Unknown Organizer'}
                    </h3>
                    
                    {organizer.category && (
                      <span className="card-category">{organizer.category}</span>
                    )}

                    {organizer.description && (
                      <p className="card-description">
                        {organizer.description.length > 90 
                          ? organizer.description.substring(0, 90) + '...'
                          : organizer.description}
                      </p>
                    )}

                    <div className="card-meta">
                      {organizer.firstName && (
                        <div className="meta-row">
                          <span className="meta-icon">👤</span>
                          <span className="meta-text">
                            {organizer.firstName} {organizer.lastName}
                          </span>
                        </div>
                      )}
                      {organizer.contactEmail && (
                        <div className="meta-row">
                          <span className="meta-icon">📧</span>
                          <span className="meta-text">{organizer.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer with Action */}
                  <div className="card-footer">
                    <button
                      onClick={() => handleToggleFollow(organizer._id)}
                      className={`modern-follow-btn ${isFollowing(organizer._id) ? 'following' : ''}`}
                    >
                      {isFollowing(organizer._id) ? (
                        <>
                          <span className="btn-icon">✓</span>
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">+</span>
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FollowOrganizers;
