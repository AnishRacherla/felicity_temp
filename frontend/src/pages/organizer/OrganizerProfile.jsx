/**
 * ORGANIZER PROFILE PAGE
 * 
 * Manage organizer profile and settings
 * - Edit organizer information
 * - Update contact details
 * - Configure Discord webhook
 * - Change password
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './OrganizerProfile.css';

function OrganizerProfile() {
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
    organizerName: '',
    email: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhook: '',
  });

  // Password Reset Request State
  const [resetReason, setResetReason] = useState('');
  const [resetRequests, setResetRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Available categories
  const categories = [
    'Club', 'Council', 'Fest Team', 'Technical', 'Cultural', 'Sports', 'Other'
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
      const response = await organizerAPI.getProfile();
      const profile = response.data.profile;

      setProfileData({
        organizerName: profile.organizerName || '',
        email: profile.email || '',
        category: profile.category || '',
        description: profile.description || '',
        contactEmail: profile.contactEmail || '',
        contactNumber: profile.contactNumber || '',
        discordWebhook: profile.discordWebhook || '',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try again.');
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
   * SAVE PROFILE
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate Discord webhook URL if provided
      if (profileData.discordWebhook && !profileData.discordWebhook.startsWith('https://discord.com/api/webhooks/')) {
        setError('Invalid Discord webhook URL. It should start with https://discord.com/api/webhooks/');
        setSaving(false);
        return;
      }

      await organizerAPI.updateProfile({
        organizerName: profileData.organizerName,
        category: profileData.category,
        description: profileData.description,
        contactEmail: profileData.contactEmail,
        contactNumber: profileData.contactNumber,
        discordWebhook: profileData.discordWebhook,
      });

      setSuccess('✅ Profile updated successfully!');
      
      // Update user context
      if (updateUser) {
        updateUser({
          ...user,
          organizerName: profileData.organizerName,
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
   * FETCH PASSWORD RESET REQUESTS
   */
  useEffect(() => {
    if (activeTab === 'security') {
      fetchPasswordResetRequests();
    }
  }, [activeTab]);

  const fetchPasswordResetRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await organizerAPI.getMyPasswordResetRequests();
      setResetRequests(response.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch reset requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  /**
   * SUBMIT PASSWORD RESET REQUEST
   */
  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();

    if (!resetReason || resetReason.trim().length < 10) {
      setError('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await organizerAPI.requestPasswordReset({ reason: resetReason });
      
      setResetReason('');
      setSuccess('✅ Password reset request submitted successfully! Admin will review your request.');
      setTimeout(() => setSuccess(''), 5000);
      
      // Refresh requests list
      fetchPasswordResetRequests();
    } catch (err) {
      console.error('Failed to submit reset request:', err);
      setError(err.response?.data?.message || 'Failed to submit password reset request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * TEST DISCORD WEBHOOK
   */
  const testDiscordWebhook = async () => {
    if (!profileData.discordWebhook) {
      alert('Please enter a Discord webhook URL first.');
      return;
    }

    try {
      const response = await fetch(profileData.discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '✅ Discord webhook test successful! Your events will be automatically posted here.',
          embeds: [{
            title: 'Webhook Connected',
            description: 'This is a test message from Felicity Event Management System.',
            color: 5814783,
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      if (response.ok) {
        alert('✅ Discord webhook test successful! Check your Discord channel.');
      } else {
        alert('❌ Discord webhook test failed. Please check the URL and try again.');
      }
    } catch (err) {
      alert('❌ Discord webhook test failed. Please check the URL and try again.');
    }
  };

  if (loading) {
    return (
      <div className="organizer-profile loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="organizer-profile">
      {/* Header */}
      <div className="page-header">
        <h1>Organizer Profile</h1>
        <p>Manage your organization details and settings</p>
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
              <h2>Organization Details</h2>
              
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  name="organizerName"
                  value={profileData.organizerName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Technical Club, Cultural Committee"
                />
              </div>

              <div className="form-group">
                <label>Login Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="disabled-field"
                />
                <small className="field-hint">Login email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={profileData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={profileData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe your organization and what events you typically organize..."
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h2>Contact Information</h2>
              <p className="section-description">This information will be visible to participants</p>

              <div className="form-row">
                <div className="form-group">
                  <label>Public Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={profileData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="contact@organization.com"
                  />
                </div>

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
              </div>
            </div>

            {/* Discord Integration */}
            <div className="form-section">
              <h2>Discord Integration</h2>
              <p className="section-description">
                Automatically post new events to your Discord server. 
                <a 
                  href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="help-link"
                >
                  Learn how to create a webhook
                </a>
              </p>

              <div className="form-group">
                <label>Discord Webhook URL</label>
                <input
                  type="url"
                  name="discordWebhook"
                  value={profileData.discordWebhook}
                  onChange={handleInputChange}
                  placeholder="https://discord.com/api/webhooks/..."
                />
                <small className="field-hint">
                  Events will be automatically posted to Discord when published
                </small>
              </div>

              {profileData.discordWebhook && (
                <button
                  type="button"
                  className="test-webhook-btn"
                  onClick={testDiscordWebhook}
                >
                  Test Webhook
                </button>
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
          {/* Password Reset Request Form */}
          <form onSubmit={handlePasswordResetRequest}>
            <div className="form-section">
              <h2>🔒 Password Reset Request</h2>
              <div className="info-banner">
                <p>
                  🔒 For security reasons, organizers cannot change passwords directly. 
                  Submit a request to admin with a valid reason.
                </p>
                <p style={{marginTop: '0.5rem'}}>
                  📧 When approved, you'll receive the new password via <strong>email</strong> and it will be displayed below in your request history.
                </p>
              </div>

              <div className="form-group">
                <label>Reason for Password Reset *</label>
                <textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Explain why you need a password reset (e.g., forgot password, security concern, etc.)"
                  rows={4}
                  required
                  minLength={10}
                />
                <small className="field-hint">Minimum 10 characters. Be specific about your reason.</small>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Submitting...' : '📨 Submit Request'}
                </button>
              </div>
            </div>
          </form>

          {/* Password Reset Request History */}
          <div className="form-section reset-history">
            <h2>📋 Request History</h2>
            {loadingRequests ? (
              <p>Loading requests...</p>
            ) : resetRequests.length === 0 ? (
              <p className="no-requests">No password reset requests yet.</p>
            ) : (
              <div className="requests-list">
                {resetRequests.map((request) => (
                  <div key={request._id} className={`request-card status-${request.status.toLowerCase()}`}>
                    <div className="request-header">
                      <span className={`status-badge ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                      <span className="request-date">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="request-body">
                      <p><strong>Reason:</strong> {request.reason}</p>
                      {request.status === 'APPROVED' && request.newPassword && (
                        <div className="password-display">
                          <p><strong>✅ New Password Generated:</strong></p>
                          <code className="new-password">{request.newPassword}</code>
                          <small className="password-hint">
                            🔒 This password was also sent to your registered email address.<br/>
                            Please change it after logging in for security.
                          </small>
                        </div>
                      )}
                      {request.status === 'REJECTED' && request.adminComments && (
                        <div className="admin-comments">
                          <p><strong>Admin Comments:</strong></p>
                          <p>{request.adminComments}</p>
                        </div>
                      )}
                      {request.processedAt && (
                        <p className="processed-date">
                          Processed on {new Date(request.processedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizerProfile;
