/**
 * MANAGE ORGANIZERS PAGE
 * 
 * Admin page to manage all organizers/clubs
 * - Edit organizer details (name, category, description, etc.)
 * - Delete organizers
 * - Reset passwords
 * - Toggle active status
 */

import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './ManageOrganizers.css';

function ManageOrganizers() {
  // State
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [editForm, setEditForm] = useState({
    organizerName: '',
    firstName: '',
    lastName: '',
    category: '',
    organizerDescription: '',
    contactEmail: '',
  });
  const [updating, setUpdating] = useState(false);

  // Password reset modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetOrganizerId, setResetOrganizerId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  /**
   * FETCH ALL ORGANIZERS
   */
  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllOrganizers();
      setOrganizers(response.data.organizers || []);
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
      setError(err.response?.data?.message || 'Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  /**
   * OPEN EDIT MODAL
   */
  const openEditModal = (organizer) => {
    setEditingOrganizer(organizer);
    setEditForm({
      organizerName: organizer.organizerName || '',
      firstName: organizer.firstName || '',
      lastName: organizer.lastName || '',
      category: organizer.category || '',
      organizerDescription: organizer.organizerDescription || organizer.description || '',
      contactEmail: organizer.contactEmail || '',
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  /**
   * HANDLE EDIT FORM CHANGE
   */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  /**
   * SUBMIT EDIT
   */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.organizerName || !editForm.category) {
      setError('Organizer name and category are required');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      
      const response = await adminAPI.updateOrganizer(editingOrganizer._id, editForm);
      
      // Update local state
      setOrganizers(organizers.map(org => 
        org._id === editingOrganizer._id 
          ? { ...org, ...editForm }
          : org
      ));
      
      setSuccess('Organizer updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to update organizer:', err);
      setError(err.response?.data?.message || 'Failed to update organizer');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * TOGGLE ACTIVE STATUS
   */
  const handleToggleStatus = async (organizer) => {
    const action = organizer.isActive ? 'disable' : 'enable';
    
    if (!window.confirm(`Are you sure you want to ${action} ${organizer.organizerName}?`)) {
      return;
    }

    try {
      await adminAPI.toggleOrganizerStatus(organizer._id);
      
      // Update local state
      setOrganizers(organizers.map(org => 
        org._id === organizer._id 
          ? { ...org, isActive: !org.isActive }
          : org
      ));
      
      alert(`${organizer.organizerName} ${action}d successfully!`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  /**
   * DELETE ORGANIZER
   */
  const handleDelete = async (organizer) => {
    if (!window.confirm(
      `⚠️ Are you sure you want to DELETE ${organizer.organizerName}?\n\n` +
      `This will permanently remove the organizer account. This action cannot be undone!\n\n` +
      `Type "${organizer.organizerName}" to confirm:`
    )) {
      return;
    }

    const confirmation = prompt(`Type "${organizer.organizerName}" to confirm deletion:`);
    if (confirmation !== organizer.organizerName) {
      alert('Deletion cancelled - name did not match');
      return;
    }

    try {
      await adminAPI.deleteOrganizer(organizer._id);
      
      // Remove from local state
      setOrganizers(organizers.filter(org => org._id !== organizer._id));
      
      alert(`${organizer.organizerName} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete organizer:', err);
      alert(err.response?.data?.message || 'Failed to delete organizer');
    }
  };

  /**
   * OPEN PASSWORD RESET MODAL
   */
  const openPasswordModal = (organizerId) => {
    setResetOrganizerId(organizerId);
    setNewPassword('');
    setShowPasswordModal(true);
    setError('');
    setSuccess('');
  };

  /**
   * RESET PASSWORD
   */
  const handleResetPassword = async () => {
    try {
      setResetting(true);
      setError('');
      
      const response = await adminAPI.resetOrganizerPassword(resetOrganizerId);
      
      setSuccess(`Password reset successfully! New password: ${response.data.newPassword || response.data.password}`);
      setNewPassword(response.data.newPassword || response.data.password);
      
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="manage-organizers loading"><p>Loading organizers...</p></div>;
  }

  return (
    <div className="manage-organizers">
      {/* Header */}
      <div className="page-header">
        <h1>Manage Organizers</h1>
        <p>Edit, disable, or delete organizer accounts</p>
      </div>

      {/* Global Messages */}
      {error && !showEditModal && !showPasswordModal && (
        <div className="error-message">{error}</div>
      )}
      {success && !showEditModal && !showPasswordModal && (
        <div className="success-message">{success}</div>
      )}

      {/* Organizers Count */}
      <div className="organizers-stats">
        <div className="stat-card">
          <div className="stat-value">{organizers.length}</div>
          <div className="stat-label">Total Organizers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{organizers.filter(o => o.isActive).length}</div>
          <div className="stat-label">Active Organizers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{organizers.filter(o => !o.isActive).length}</div>
          <div className="stat-label">Inactive Organizers</div>
        </div>
      </div>

      {/* Organizers List */}
      {organizers.length === 0 ? (
        <div className="no-organizers">
          <p>No organizers found. Create one from the Admin Dashboard.</p>
        </div>
      ) : (
        <div className="organizers-grid">
          {organizers.map((org) => (
            <div key={org._id} className={`organizer-card ${!org.isActive ? 'inactive' : ''}`}>
              {/* Status Badge */}
              <div className="card-header">
                <span className={`status-badge ${org.isActive ? 'active' : 'inactive'}`}>
                  {org.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
                <span className="category-badge">{org.category}</span>
              </div>

              {/* Organizer Info */}
              <div className="card-body">
                <h3>{org.organizerName}</h3>
                <p className="organizer-name">
                  👤 {org.firstName} {org.lastName}
                </p>
                <p className="organizer-email">
                  📧 {org.email}
                </p>
                {org.contactEmail && org.contactEmail !== org.email && (
                  <p className="contact-email">
                    📞 Contact: {org.contactEmail}
                  </p>
                )}
                {org.organizerDescription && (
                  <p className="description">{org.organizerDescription}</p>
                )}
                {org.description && !org.organizerDescription && (
                  <p className="description">{org.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="card-actions">
                <button 
                  onClick={() => openEditModal(org)}
                  className="btn btn-edit"
                  title="Edit organizer details"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => handleToggleStatus(org)}
                  className={`btn ${org.isActive ? 'btn-disable' : 'btn-enable'}`}
                  title={org.isActive ? 'Disable organizer' : 'Enable organizer'}
                >
                  {org.isActive ? '🚫 Disable' : '✅ Enable'}
                </button>
                <button 
                  onClick={() => openPasswordModal(org._id)}
                  className="btn btn-password"
                  title="Reset password"
                >
                  🔑 Reset Password
                </button>
                <button 
                  onClick={() => handleDelete(org)}
                  className="btn btn-delete"
                  title="Delete organizer permanently"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Organizer</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label>Organizer Name (Club Name) *</label>
                <input
                  type="text"
                  name="organizerName"
                  value={editForm.organizerName}
                  onChange={handleEditChange}
                  required
                  placeholder="e.g., IEEE Student Branch"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    placeholder="Club head first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    placeholder="Club head last name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Academic">Academic</option>
                  <option value="Social Service">Social Service</option>
                  <option value="Arts">Arts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="organizerDescription"
                  value={editForm.organizerDescription}
                  onChange={handleEditChange}
                  rows="4"
                  placeholder="Brief description about the club/organizer"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={editForm.contactEmail}
                  onChange={handleEditChange}
                  placeholder="Public contact email"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-cancel"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-submit"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Organizer Password</h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && (
              <div className="success-message">
                <p>{success}</p>
                <div className="password-display">
                  <strong>Copy this password now:</strong>
                  <input 
                    type="text" 
                    value={newPassword} 
                    readOnly 
                    className="password-field"
                    onClick={(e) => e.target.select()}
                  />
                </div>
                <p className="warning">⚠️ This password won't be shown again!</p>
              </div>
            )}

            {!success && (
              <>
                <p className="modal-description">
                  This will generate a new random password and send it to the organizer's email.
                </p>
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordModal(false)}
                    className="btn btn-cancel"
                    disabled={resetting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleResetPassword}
                    className="btn btn-submit"
                    disabled={resetting}
                  >
                    {resetting ? 'Resetting...' : '🔑 Reset Password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageOrganizers;
