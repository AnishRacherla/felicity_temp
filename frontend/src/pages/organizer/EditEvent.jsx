/**
 * EDIT EVENT PAGE
 * 
 * For organizers to edit existing events
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { organizerAPI } from '../../services/api';

function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    eventType: 'NORMAL',
    eventStartDate: '',
    eventEndDate: '',
    registrationDeadline: '',
    registrationLimit: '',
    registrationFee: 0,
    eligibility: 'ALL',
    tags: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getEventDetails(id);
      const event = response.data.event;
      
      setFormData({
        eventName: event.eventName,
        description: event.description,
        eventType: event.eventType,
        eventStartDate: new Date(event.eventStartDate).toISOString().slice(0, 16),
        eventEndDate: new Date(event.eventEndDate).toISOString().slice(0, 16),
        registrationDeadline: new Date(event.registrationDeadline).toISOString().slice(0, 16),
        registrationLimit: event.registrationLimit || '',
        registrationFee: event.registrationFee || 0,
        eligibility: event.eligibility,
        tags: event.tags?.join(', ') || '',
      });
    } catch (error) {
      console.error('Failed to fetch event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const eventData = {
        ...formData,
        registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : undefined,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      await organizerAPI.updateEvent(id, eventData);
      alert('✅ Event updated successfully!');
      navigate('/organizer/events');
    } catch (err) {
      console.error('Failed to update event:', err);
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading event...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Edit Event</h1>
        <p style={{ color: '#666' }}>Update event details</p>
      </div>

      {error && (
        <div style={{ background: '#fee', padding: '15px', borderRadius: '6px', color: '#c00', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>Basic Details</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Event Name *</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Event Type *</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                disabled
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#e5e7eb', cursor: 'not-allowed' }}
              >
                <option value="NORMAL">Normal Event</option>
                <option value="MERCHANDISE">Merchandise</option>
              </select>
              <small style={{ color: '#666' }}>Event type cannot be changed</small>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Eligibility *</label>
              <select
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="ALL">All Participants</option>
                <option value="IIIT_ONLY">IIIT Students Only</option>
                <option value="NON_IIIT_ONLY">Non-IIIT Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Event Start Date *</label>
              <input
                type="datetime-local"
                name="eventStartDate"
                value={formData.eventStartDate}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Event End Date *</label>
              <input
                type="datetime-local"
                name="eventEndDate"
                value={formData.eventEndDate}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Registration Deadline *</label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Registration Limit</label>
              <input
                type="number"
                name="registrationLimit"
                value={formData.registrationLimit}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Registration Fee (₹)</label>
              <input
                type="number"
                name="registrationFee"
                value={formData.registrationFee}
                onChange={handleChange}
                min="0"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., tech, workshop, free"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/organizer/events')}
            style={{
              background: '#6b7280',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditEvent;
