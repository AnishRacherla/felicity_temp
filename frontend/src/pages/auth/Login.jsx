/**
 * LOGIN PAGE - User login form
 * 
 * What happens here:
 * 1. User enters email and password
 * 2. Click "Login" button
 * 3. Send data to backend (/api/auth/login)
 * 4. If success → Redirect to dashboard
 * 5. If fail → Show error message
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();  // Get login function and user from context

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * REDIRECT IF ALREADY LOGGED IN
   * without loading the login page it will redirect to the dashboard if the user is already logged in. 
   * This is done by checking the user object from the AuthContext. 
   * If the user object is not null, it means the user is logged in and we can redirect them to the appropriate dashboard based on their role.
   */
  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to appropriate dashboard
      if (user.role === 'participant') {
        navigate('/dashboard');
      } else if (user.role === 'organizer') {
        navigate('/organizer/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      }
    }
  }, [user, navigate]);

  /**
   * HANDLE INPUT CHANGE
   * Update formData when user types
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * HANDLE FORM SUBMIT
   * Send login request
   */
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent page refresh
    setError('');        // Clear previous errors
    setLoading(true);    // Show loading state

    // Call login function from AuthContext
    const result = await login(formData.email, formData.password);

    setLoading(false);

    if (result.success) {
      // Success! Redirect based on role
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role === 'participant') {
        navigate('/dashboard');
      } else if (user.role === 'organizer') {
        navigate('/organizer/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } else {
      // Failed! Show error message
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login to Felicity</h1>
        <p className="auth-subtitle">Welcome back! Please enter your details.</p>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Link to Register */}
        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
