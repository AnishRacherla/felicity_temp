/**
 * REGISTER PAGE - New participant registration
 * 
 * What happens here:
 * 1. User fills registration form
 * 2. Select IIIT or Non-IIIT
 * 3. If IIIT → Must use @students.iiit.ac.in email
 * 4. Click "Register" button
 * 5. Send data to backend (/api/auth/register)
 * 6. If success → Redirect to dashboard (logged in automatically)
 * 7. If fail → Show error message
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const { register, user } = useAuth();  // Get register function and user from context

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    participantType: 'IIIT',
    collegeName: '',
    contactNumber: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * REDIRECT IF ALREADY LOGGED IN
   */
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  /**
   * HANDLE INPUT CHANGE
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * HANDLE FORM SUBMIT
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validation: IIIT email check
    if (formData.participantType === 'IIIT') {
      if (!formData.email.endsWith('@students.iiit.ac.in') && 
          !formData.email.endsWith('@research.iiit.ac.in')) {
        setError('IIIT participants must use their IIIT email');
        return;
      }
    }

    setLoading(true);

    // Prepare data (remove confirmPassword)
    const { confirmPassword, ...registerData } = formData;

    // Call register function
    const result = await register(registerData);//the function present in authcontext which makes the api call to backend and returns the response

    setLoading(false);

    if (result.success) {
      // Success! Redirect to dashboard
      navigate('/dashboard');
    } else {
      // Failed! Show error
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join Felicity and discover amazing events!</p>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Participant Type */}
          <div className="form-group">
            <label>Participant Type</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="participantType"
                  value="IIIT"
                  checked={formData.participantType === 'IIIT'}
                  onChange={handleChange}
                />
                IIIT Student
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="participantType"
                  value="NON_IIIT"
                  checked={formData.participantType === 'NON_IIIT'}
                  onChange={handleChange}
                />
                Non-IIIT Participant
              </label>
            </div>
          </div>

          {/* Name Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={
                formData.participantType === 'IIIT'
                  ? 'yourname@students.iiit.ac.in'
                  : 'your.email@example.com'
              }
              required
            />
            {formData.participantType === 'IIIT' && (
              <small className="form-hint">
                Use your IIIT email (@students.iiit.ac.in or @research.iiit.ac.in)
              </small>
            )}
          </div>

          {/* College Name */}
          <div className="form-group">
            <label htmlFor="collegeName">College / Organization Name</label>
            <input
              type="text"
              id="collegeName"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleChange}
              placeholder="IIIT Hyderabad"
              required
            />
          </div>

          {/* Contact Number */}
          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+91 1234567890"
            />
          </div>

          {/* Password Fields */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              minLength="6"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Link to Login */}
        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
