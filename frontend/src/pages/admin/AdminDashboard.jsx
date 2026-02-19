/**
 * ADMIN DASHBOARD
 * 
 * Features:
 * - View system statistics
 * - Create new organizers (club heads)
 * - View all organizers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);//use state allows a fixed way to change the varaible and after upating it automatically changes ui accordingly
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create organizer form state
  const [formData, setFormData] = useState({
    loginEmail: '',
    organizerName: '',
    category: 'Technical',
    description: '',
    contactEmail: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();//it fetches the data from backend once noteverytime the component re-renders. 
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch system stats
      const statsResponse = await adminAPI.getSystemStats();
      setStats(statsResponse.data.stats);

      // Fetch all organizers
      const organizersResponse = await adminAPI.getAllOrganizers();
      setOrganizers(organizersResponse.data.organizers || []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateOrganizer = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.createOrganizer(formData);
      setSuccess(`✅ Organizer created successfully! Password: ${response.data.organizer.password}`);
      
      // Reset form
      setFormData({
        loginEmail: '',
        organizerName: '',
        category: 'Technical',
        description: '',
        contactEmail: '',
      });

      // Refresh organizers list
      fetchDashboardData();
      
      // Keep form open so admin can copy password
      // User can manually close by clicking "Cancel" button
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organizer');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#e5e7eb' }}>Admin Dashboard</h1>
        <p style={{ color: '#9ca3af' }}>Manage organizers and view system statistics</p>
      </div>

      {/* System Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b9dff' }}>{stats.totalEvents || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Total Events</div>
          </div>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b9dff' }}>{stats.totalParticipants || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Total Participants</div>
          </div>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b9dff' }}>{stats.totalOrganizers || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Total Organizers</div>
          </div>
          <div style={{ background: '#1a2332', padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b9dff' }}>{stats.totalRegistrations || 0}</div>
            <div style={{ color: '#9ca3af', marginTop: '5px' }}>Total Registrations</div>
          </div>
        </div>
      )}

      {/* Create Organizer Button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: '#8b9dff',
            color: '#0f1419',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {showCreateForm ? '❌ Cancel' : '➕ Create New Organizer (Club Head)'}
        </button>
      </div>

      {/* Create Organizer Form */}
      {showCreateForm && (
        <div style={{ background: '#1a2332', padding: '30px', borderRadius: '12px', marginBottom: '40px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
          <h2 style={{ color: '#e5e7eb' }}>Create New Organizer</h2>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
            Create a new club head/organizer who can create and manage events
          </p>

          {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '15px', borderRadius: '8px', color: '#ef4444', marginBottom: '20px', border: '1px solid #ef4444' }}>{error}</div>}
          {success && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '10px' }}>
                ✅ Organizer Created Successfully!
              </div>
              <div style={{ background: '#0f1419', padding: '15px', borderRadius: '8px', marginTop: '10px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
                <div style={{ fontWeight: '600', color: '#e5e7eb', marginBottom: '5px' }}>📧 Login Email:</div>
                <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#8b9dff', marginBottom: '15px', userSelect: 'all' }}>
                  {formData.loginEmail}
                </div>
                <div style={{ fontWeight: '600', color: '#e5e7eb', marginBottom: '5px' }}>🔑 Password (copy this now):</div>
                <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#ef4444', fontWeight: 'bold', userSelect: 'all', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  {success.split('Password: ')[1]}
                </div>
              </div>
              <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '8px', fontSize: '14px', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                ⚠️ <strong>Important:</strong> Save this password now! You won't see it again. Give these credentials to the club head.
              </div>
            </div>
          )}

          <form onSubmit={handleCreateOrganizer}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Login Email *</label>
              <input
                type="email"
                name="loginEmail"
                value={formData.loginEmail}
                onChange={handleInputChange}
                required
                placeholder="organizer@felicity.iiit.ac.in"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.3)', background: '#0f1419', color: '#e5e7eb' }}
              />
              <small style={{ color: '#9ca3af' }}>This will be used to login</small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Club/Team Name *</label>
              <input
                type="text"
                name="organizerName"
                value={formData.organizerName}
                onChange={handleInputChange}
                required
                placeholder="E-Cell, TechTeam, Chess Club, etc."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.3)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.3)', background: '#0f1419', color: '#e5e7eb' }}
              >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="3"
                placeholder="Brief description of the club/team"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.3)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="Public contact email"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(139, 157, 255, 0.3)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                background: '#10b981',
                color: 'white',
                padding: '12px 32px',
                border: 'none',
                borderRadius: '6px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {creating ? 'Creating...' : 'Create Organizer'}
            </button>
          </form>
        </div>
      )}

      {/* Organizers List */}
      <div>
        <h2 style={{ color: '#e5e7eb' }}>Existing Organizers ({organizers.length})</h2>
        {organizers.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '20px', background: '#1a2332', borderRadius: '12px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            No organizers yet. Create the first one using the button above!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
            {organizers.map((org) => (
              <div key={org._id} style={{ background: '#1a2332', border: '1px solid rgba(139, 157, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#e5e7eb' }}>{org.organizerName}</h3>
                    <p style={{ margin: '5px 0', color: '#9ca3af' }}>
                      👤 {org.firstName} {org.lastName}
                    </p>
                    <p style={{ margin: '5px 0', color: '#8b9dff' }}>
                      📧 {org.email}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <span style={{ background: 'rgba(139, 157, 255, 0.2)', color: '#8b9dff', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                        {org.category}
                      </span>
                    </p>
                    <p style={{ margin: '10px 0 0 0', color: '#9ca3af', fontSize: '14px' }}>
                      {org.organizerDescription}
                    </p>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {org.isActive ? '✅ Active' : '❌ Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
