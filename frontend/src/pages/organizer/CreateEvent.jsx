/**
 * CREATE EVENT PAGE
 * 
 * For organizers to create new events
 * Features:
 * - Event basic details
 * - Custom registration forms
 * - Merchandise options
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';

function CreateEvent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    eventType: 'NORMAL',
    eventStartDate: '',
    eventEndDate: '',
    venue: '',
    registrationDeadline: '',
    registrationLimit: '',
    registrationFee: 0,
    eligibility: 'ALL',
    tags: '',
    // Merchandise fields
    sizes: '',
    colors: '',
    stock: '',
  });

  const [customForm, setCustomForm] = useState([]);//custom form is an array of objects where each object represents a form field with its properties like fieldName, fieldType, required, options, etc. This allows us to dynamically add and manage custom fields for the registration form of the event.
  const [newField, setNewField] = useState({
    fieldName: '',
    fieldType: 'text',
    required: false,
    options: '',
    placeholder: ''
  });//temporary state to manage the new field being added to the custom form. 
  // It holds the values of the form inputs for creating a new custom field before it is added to the customForm array. 
  // Once the user fills in the details for the new field and clicks "Add Field", this newField state is used to create a new field object that gets added to the customForm array, and then it is reset back to its initial state for adding another field if needed.

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleAddFormField = () => {
    if (!newField.fieldName) {
      alert('Please enter field name');
      return;
    }

    if (newField.fieldType === 'dropdown') {
      const options = newField.options.split(',').map(o => o.trim()).filter(Boolean);
      if (!options.length) {
        alert('Please add at least one option for dropdown');
        return;
      }
    }

    const field = {
      ...newField,
      options: newField.fieldType === 'dropdown'
        ? newField.options.split(',').map(o => o.trim()).filter(Boolean)
        : undefined
    };

    setCustomForm([...customForm, field]);
    setNewField({
      fieldName: '',
      fieldType: 'text',
      required: false,
      options: '',
      placeholder: ''
    });
  };

  const handleRemoveFormField = (index) => {
    setCustomForm(customForm.filter((_, i) => i !== index));
  };//removes the field at a particular index since custom form is an array of fields and each field has a index we can use that index to remove the field from the custom form array.

  const handleSubmit = async (e) => {
    e.preventDefault();//prevents the default form submission behavior which would cause a page reload. 
    

    setCreating(true);//disables the create button and shows creating...
    //  while the event is being created to prevent multiple submissions.

    setError('');//clears the previous error message if there is any when the user tries to create a new event again after a failed attempt.
    //  This ensures that the error state is reset and does not show outdated error messages from previous attempts.

    const startDate = new Date(formData.eventStartDate);
    const endDate = new Date(formData.eventEndDate);
    const deadlineDate = new Date(formData.registrationDeadline);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || Number.isNaN(deadlineDate.getTime())) {
      setError('Please provide valid event dates');
      setCreating(false);
      return;
    }

    if (endDate <= startDate) {
      setError('Event end date must be after event start date');
      setCreating(false);
      return;
    }

    if (deadlineDate > endDate) {
      setError('Registration deadline must be before event end');
      setCreating(false);
      return;
    }

    if (deadlineDate > startDate) {
      setError('Registration deadline must be before event start');
      setCreating(false);
      return;
    }

    if (formData.registrationLimit && Number(formData.registrationLimit) <= 0) {
      setError('Registration limit must be greater than 0');
      setCreating(false);
      return;
    }

    try {
      const eventData = {
        ...formData,

        //converting strings to proper types
        registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : undefined,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        
        //converting tags string  into array
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      // Add custom form for normal events
      if (formData.eventType === 'NORMAL' && customForm.length > 0) {
        const fieldTypeMap = {
          text: 'TEXT',
          textarea: 'TEXTAREA',
          dropdown: 'DROPDOWN',
          checkbox: 'CHECKBOX',
          radio: 'RADIO',
          file: 'FILE'
        };

        eventData.customForm = customForm.map((field, index) => ({
          fieldName: field.fieldName?.trim(),
          fieldType: fieldTypeMap[field.fieldType] || field.fieldType?.toUpperCase(),
          options: field.options,
          required: Boolean(field.required),
          order: typeof field.order === 'number' ? field.order : index
        }));
      }

      // Add merchandise details if type is MERCHANDISE
      if (formData.eventType === 'MERCHANDISE') {
        const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
        const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : [];
        const totalStock = parseInt(formData.stock) || 0;
        
        // Create variants from sizes and colors combination with proper stock distribution
        const variants = [];
        if (sizes.length > 0 && colors.length > 0) {
          const numVariants = sizes.length * colors.length;
          const baseStock = Math.floor(totalStock / numVariants);
          const remainder = totalStock % numVariants;
          
          let variantIndex = 0;
          for (let size of sizes) {
            for (let color of colors) {
              // Distribute remainder stock to first few variants
              const variantStock = variantIndex < remainder ? baseStock + 1 : baseStock;
              variants.push({
                name: `${size} - ${color}`,
                size: size,
                color: color,
                price: parseInt(formData.registrationFee) || 0,
                stock: variantStock
              });
              variantIndex++;
            }
          }
        }
        
        eventData.merchandise = {
          sizes,
          colors,
          stockQuantity: totalStock,
          variants: variants.length > 0 ? variants : undefined,
          purchaseLimit: 1
        };
      }

      await organizerAPI.createEvent(eventData);//sending to backend(API call) and if successful it will return the created event data and if there is an error it will throw an error which we can catch in the catch block. 
      alert('✅ Event created successfully!');
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#e5e7eb' }}>Create New Event</h1>
        <p style={{ color: '#9ca3af' }}>Fill in the details to create a new event</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '6px', color: '#ef4444', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div style={{ background: '#1a2332', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
          <h2 style={{ marginTop: 0, color: '#e5e7eb' }}>Basic Details</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Event Name *</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              required
              placeholder="Hackathon 2026"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe your event..."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Event Type *</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              >
                <option value="NORMAL">Normal Event</option>
                <option value="MERCHANDISE">Merchandise</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Eligibility *</label>
              <select
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              >
                <option value="ALL">All Participants</option>
                <option value="IIIT_ONLY">IIIT Students Only</option>
                <option value="NON_IIIT_ONLY">Non-IIIT Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Event Start Date *</label>
              <input
                type="datetime-local"
                name="eventStartDate"
                value={formData.eventStartDate}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Event End Date *</label>
              <input
                type="datetime-local"
                name="eventEndDate"
                value={formData.eventEndDate}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Venue *</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
              placeholder="Auditorium, Online, etc."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Registration Deadline *</label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Registration Limit</label>
              <input
                type="number"
                name="registrationLimit"
                value={formData.registrationLimit}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Registration Fee (₹)</label>
              <input
                type="number"
                name="registrationFee"
                value={formData.registrationFee}
                onChange={handleChange}
                min="0"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="hackathon, coding, competition"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
            />
          </div>
        </div>

        {/* Custom Form Builder for Normal Events */}
        {formData.eventType === 'NORMAL' && (
          <div style={{ background: '#1a2332', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <h2 style={{ marginTop: 0, color: '#e5e7eb' }}>Custom Registration Form (Optional)</h2>
            <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Add custom fields participants must fill during registration</p>

            {/* Added Fields */}
            {customForm.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#e5e7eb' }}>Form Fields:</h4>
                {customForm.map((field, index) => (
                  <div key={index} style={{ background: '#0f1419', padding: '12px', marginBottom: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
                    <div style={{ color: '#e5e7eb' }}>
                      <strong>{field.fieldName}</strong> ({field.fieldType})
                      {field.required && <span style={{ color: '#ef4444', marginLeft: '8px' }}>*</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFormField(index)}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Field */}
            <div style={{ background: '#0f1419', padding: '15px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Field name (e.g., Team Name)"
                  value={newField.fieldName}
                  onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#1a2332', color: '#e5e7eb' }}
                />
                <select
                  value={newField.fieldType}
                  onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#1a2332', color: '#e5e7eb' }}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="dropdown">Dropdown</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e5e7eb' }}>
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  />
                  Required
                </label>
              </div>
              {newField.fieldType === 'dropdown' && (
                <input
                  type="text"
                  placeholder="Options (comma-separated)"
                  value={newField.options}
                  onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid rgba(139, 157, 255, 0.2)', marginBottom: '10px', background: '#1a2332', color: '#e5e7eb' }}
                />
              )}
              <button
                type="button"
                onClick={handleAddFormField}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ➕ Add Field
              </button>
            </div>
          </div>
        )}

        {/* Merchandise Options */}
        {formData.eventType === 'MERCHANDISE' && (
          <div style={{ background: '#1a2332', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(139, 157, 255, 0.2)' }}>
            <h2 style={{ marginTop: 0, color: '#e5e7eb' }}>Merchandise Details</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Available Sizes (comma-separated)</label>
              <input
                type="text"
                name="sizes"
                value={formData.sizes}
                onChange={handleChange}
                placeholder="S, M, L, XL, XXL"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Available Colors (comma-separated)</label>
              <input
                type="text"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                placeholder="Black, White, Blue"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#e5e7eb' }}>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="1"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 157, 255, 0.2)', background: '#0f1419', color: '#e5e7eb' }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            type="submit"
            disabled={creating}
            style={{
              background: '#4f46e5',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '6px',
              cursor: creating ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {creating ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
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

export default CreateEvent;
