/**
 * PARTICIPANT PROFILE PAGE
 * 
 * Manage participant profile and settings
 * - Edit personal information
 * - Update interests
 * - View followed organizers
 * - Change password
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ParticipantProfile.css';

function ParticipantProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // profile, security

  // Profile Data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    collegeName: '',
    participantType: '',
    interests: [],
    followedOrganizers: [],
  });

  // Password Change Data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Available interests
  const availableInterests = [
    'Technical', 'Cultural', 'Sports', 'Music', 'Dance', 
    'Drama', 'Art', 'Photography', 'Gaming', 'Robotics',
    'Coding', 'Design', 'Writing', 'Debate', 'Social Work'
  ];

  /**
   * FETCH PROFILE
   */
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching participant profile...');
      const response = await participantAPI.getProfile();
      console.log('Profile response:', response.data);
      
      if (!response.data || !response.data.profile) {
        throw new Error('Profile data not found in response');
      }
      
      const profile = response.data.profile;

      setProfileData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        contactNumber: profile.contactNumber || '',
        collegeName: profile.collegeName || '',
        participantType: profile.participantType || '',
        interests: profile.interests || [],
        followedOrganizers: profile.followedOrganizers || [],
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage;
      if (err.response?.status === 403) {
        errorMessage = 'Access denied. This page is only for participants.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please login to view your profile.';
      } else {
        errorMessage = err.response?.data?.message || err.message || 'Failed to load profile. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * HANDLE INPUT CHANGE
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * TOGGLE INTEREST
   */
  const toggleInterest = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  /**
   * SAVE PROFILE
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update profile
      await participantAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        contactNumber: profileData.contactNumber,
        collegeName: profileData.collegeName,
      });

      // Update preferences (interests)
      await participantAPI.setPreferences({
        interests: profileData.interests,
      });

      setSuccess('✅ Profile updated successfully!');
      
      // Update user context
      if (updateUser) {
        updateUser({
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * HANDLE PASSWORD CHANGE
   */
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long!');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Call backend API to change password
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSuccess('✅ Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="participant-profile loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="participant-profile">
      {/* Header */}
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          Security Settings
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="profile-section">
          <form onSubmit={handleSaveProfile}>
            {/* Basic Information */}
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="disabled-field"
                />
                <small className="field-hint">Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Participant Type</label>
                <input
                  type="text"
                  value={profileData.participantType === 'IIIT' ? 'IIIT Student' : 'Non-IIIT'}
                  disabled
                  className="disabled-field"
                />
                <small className="field-hint">Participant type cannot be changed</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label>College/Organization</label>
                  <input
                    type="text"
                    name="collegeName"
                    value={profileData.collegeName}
                    onChange={handleInputChange}
                    placeholder="Enter your college name"
                  />
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="form-section">
              <h2>Interests</h2>
              <p className="section-description">Select your areas of interest to get personalized event recommendations</p>
              
              <div className="interests-grid">
                {availableInterests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-chip ${profileData.interests.includes(interest) ? 'selected' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {profileData.interests.includes(interest) ? '✓ ' : ''}
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Followed Organizers */}
            <div className="form-section">
              <h2>Followed Organizers</h2>
              {profileData.followedOrganizers.length > 0 ? (
                <div className="followed-list">
                  {profileData.followedOrganizers.map((org) => (
                    <div key={org._id} className="followed-item">
                      <span className="org-name">
                        {org.organizerName || 'Unknown Organizer'}
                      </span>
                      {org.category && (
                        <span className="org-category">{org.category}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">
                  You are not following any organizers yet.{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate('/follow-organizers')}
                  >
                    Browse Organizers
                  </button>
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="security-section">
          <form onSubmit={handlePasswordChange}>
            <div className="form-section">
              <h2>Change Password</h2>
              <p className="section-description">Update your password to keep your account secure</p>

              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
                <small className="field-hint">Minimum 6 characters</small>
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ParticipantProfile;
