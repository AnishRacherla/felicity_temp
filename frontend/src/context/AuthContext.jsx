/**
 * AUTH CONTEXT - Manages authentication state across the entire app
 * 
 * Purpose: Keep track of logged-in user everywhere in the app
 * Without this, every component would need to check if user is logged in separately
 * 
 * What it stores:
 * - user: Current logged-in user data (null if not logged in)
 * - token: JWT token for API requests
 * - loading: Is the app checking if user is logged in?
 * 
 * What it provides:
 * - login(email, password): Log in a user
 * - logout(): Log out current user
 * - register(userData): Register new participant
 * 
 * How to use in any component:
 * const { user, login, logout } = useAuth();
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create the context (storage for auth state)
const AuthContext = createContext();

/**
 * CUSTOM HOOK - Easy way to access auth state
 * Use this in any component: const { user, login } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * AUTH PROVIDER - Wraps the entire app and provides auth state
 */
export const AuthProvider = ({ children }) => {
  // State variables
  const [user, setUser] = useState(null);           // Current user data
  const [token, setToken] = useState(null);         // JWT token
  const [loading, setLoading] = useState(true);     // Is checking auth status?

  /**
   * EFFECT: Check if user is already logged in when app loads
   * Runs once when app starts
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * CHECK AUTH - See if user is logged in (from localStorage)
   * Called when app loads
   */

  // This function checks if there is a token and user data stored in the browser's localStorage.
  //  If found, it updates the state with this information, allowing the app to recognize that the user is already logged in.
  //  If any error occurs during this process, it clears the localStorage to ensure no corrupted data remains. 
  // Finally, it sets loading to false to indicate that the auth check is complete.

  const checkAuth = async () => {
    try {
      // Step 1: Get token from localStorage (browser storage)
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // Step 2: Parse stored user data (it's stored as string)
        const parsedUser = JSON.parse(storedUser);
        
        // Step 3: Update state
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If anything fails, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);  // Done checking
    }
  };

  /**
   * LOGIN FUNCTION
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Success or error
   */


  //this function is used to store the token and user data in localStorage and update the state when a user logs in successfully. It also handles errors and returns a success status and message.
  const login = async (email, password) => {
    try {
      // Step 1: Send login request to backend
      const response = await authAPI.login({ email, password });

      // Step 2: Get token and user data from response
      const { token, user } = response.data;
      console.log('Login successful. User data:', user); // Debug log

      // Step 3: Save to localStorage (persist across browser restarts)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Step 4: Update state
      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  /**
   * REGISTER FUNCTION
   * @param {object} userData - Registration data
   * @returns {Promise} Success or error
   */

  //this function is responsible for handling the registration process of a new participant.
  //  It sends the registration data to the backend, and if successful,
  //  it stores the returned token and user data in localStorage and updates the state. 
  // It also handles errors and returns a success status and message.

  const register = async (userData) => {
    try {
      // Step 1: Send registration request to backend
      const response = await authAPI.register(userData);

      // Step 2: Get token and user data
      const { token, user } = response.data;

      // Step 3: Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Step 4: Update state
      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  /**
   * LOGOUT FUNCTION
   * Clear all auth data
   */
  //clears the token and user data from both the localStorage and the state when a user logs out, 
  // effectively logging the user out of the application.

  const logout = () => {
    // Step 1: Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Step 2: Clear state
    setToken(null);
    setUser(null);
  };

  /**
   * UPDATE USER FUNCTION
   * Update user data in state and localStorage
   */
  const updateUser = (updatedUserData) => {
    // Merge updated data with existing user data
    const updatedUser = { ...user, ...updatedUserData };
    
    // Update state
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  /**
   * EXPOSE VALUES TO ALL COMPONENTS
   * Any component can access these using useAuth()
   */

  // basically this is helping in using this functions by other components of the code using use auth

  const value = {
    user,        // Current user data
    token,       // JWT token
    loading,     // Is checking auth?
    login,       // Login function
    register,    // Register function
    logout,      // Logout function
    updateUser,  // Update user function
    // Role helpers
    isAuthenticated: !!user,  // Boolean: Is user logged in?
    isParticipant: user?.role === 'participant',  // Boolean: Is participant?
    isOrganizer: user?.role === 'organizer',      // Boolean: Is organizer?
    isAdmin: user?.role === 'admin',              // Boolean: Is admin?
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
  