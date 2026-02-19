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
      <div className="follow-organizers loading">
        <p>Loading organizers...</p>
      </div>
    );
  }

  return (
    <div className="follow-organizers">
      {/* Header */}
      <div className="page-header">
        <h1>Follow Organizers</h1>
        <p>Stay updated with your favorite event organizers!</p>
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
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Organizers ({organizers.length})
        </button>
        <button 
          className={filter === 'following' ? 'active' : ''}
          onClick={() => setFilter('following')}
        >
          Following ({followedOrganizers.length})
        </button>
      </div>

      {/* Organizers Grid */}
      {filteredOrganizers.length === 0 ? (
        <div className="no-organizers">
          <p>{filter === 'following' ? 'You are not following any organizers yet.' : 'No organizers found.'}</p>
        </div>
      ) : (
        <div className="organizers-grid">
          {filteredOrganizers.map((organizer) => (
            <div key={organizer._id} className="organizer-card">
              {/* Organizer Avatar */}
              <div className="organizer-avatar">
                <div className="avatar-placeholder">
                  {organizer.organizerName?.charAt(0).toUpperCase() || 'O'}
                </div>
              </div>

              {/* Organizer Name */}
              <h3 className="organizer-name">{organizer.organizerName || 'Unknown Organizer'}</h3>
              
              {/* Category Badge */}
              {organizer.category && (
                <span className="category-badge">
                  {organizer.category}
                </span>
              )}

              {/* Single Line Info */}
              <div className="organizer-meta">
                {organizer.firstName && (
                  <span className="meta-item">
                    👤 {organizer.firstName} {organizer.lastName}
                  </span>
                )}
                {organizer.contactEmail && (
                  <span className="meta-item">
                    📧 {organizer.contactEmail}
                  </span>
                )}
              </div>

              {/* Description */}
              {organizer.description && (
                <p className="description">
                  {organizer.description.length > 80 
                    ? organizer.description.substring(0, 80) + '...'
                    : organizer.description
                  }
                </p>
              )}

              {/* Follow Button */}
              <div className="organizer-actions">
                <button
                  onClick={() => handleToggleFollow(organizer._id)}
                  className={`follow-btn ${isFollowing(organizer._id) ? 'following' : ''}`}
                >
                  {isFollowing(organizer._id) ? '✓ Following' : '+ Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FollowOrganizers;
