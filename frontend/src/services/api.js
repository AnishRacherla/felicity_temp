import axios from 'axios';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH APIs
// ============================================

export const authAPI = {
  // Register participant
  register: (data) => api.post('/api/auth/register', data),
  
  // Login (all roles)
  login: (data) => api.post('/api/auth/login', data),
  
  // Get current user
  getMe: () => api.get('/api/auth/me'),
  
  // Change password
  changePassword: (data) => api.put('/api/auth/change-password', data),
};

// ============================================
// EVENT APIs
// ============================================

export const eventAPI = {
  // Browse all events with filters
  browseEvents: (params) => api.get('/api/events', { params }),
  
  // Get trending events
  getTrendingEvents: () => api.get('/api/events/trending'),
  
  // Get single event details
  getEventDetails: (id) => api.get(`/api/events/${id}`),
  
  // Create event (organizer only)
  createEvent: (data) => api.post('/api/events', data),
};

// ============================================
// PARTICIPANT APIs
// ============================================

export const participantAPI = {
  // Get profile
  getProfile: () => api.get('/api/participant/profile'),
  
  // Update profile
  updateProfile: (data) => api.put('/api/participant/profile', data),
  
  // Update preferences
  setPreferences: (data) => api.put('/api/participant/preferences', data),
  
  // Get my registrations
  getMyRegistrations: (params) => api.get('/api/participant/registrations', { params }),
  
  // Get upcoming events
  getUpcomingEvents: () => api.get('/api/participant/upcoming'),
  
  // Follow/unfollow organizer
  toggleFollowOrganizer: (organizerId) => api.post(`/api/participant/follow/${organizerId}`),
  
  // Get all organizers
  getOrganizers: () => api.get('/api/participant/organizers'),
  
  // Get organizer details
  getOrganizerDetails: (organizerId) => api.get(`/api/participant/organizers/${organizerId}`),
};

// ============================================
// REGISTRATION APIs
// ============================================

export const registrationAPI = {
  // Register for event
  registerForEvent: (eventId, data) => api.post(`/api/events/${eventId}/register`, data),
  
  // Purchase merchandise
  purchaseMerchandise: (eventId, data) => api.post(`/api/events/${eventId}/purchase`, data),
  
  // Upload payment proof
  uploadPaymentProof: (registrationId, data) => api.post(`/api/events/registrations/${registrationId}/payment-proof`, data),
  
  // Get ticket details
  getTicketDetails: (registrationId) => api.get(`/api/events/registrations/${registrationId}`),
  
  // Cancel registration
  cancelRegistration: (registrationId) => api.delete(`/api/events/registrations/${registrationId}`),
};

// ============================================
// ORGANIZER APIs
// ============================================

export const organizerAPI = {
  // Profile management
  getProfile: () => api.get('/api/organizer/profile'),
  updateProfile: (data) => api.put('/api/organizer/profile', data),
  
  // Password reset requests
  requestPasswordReset: (data) => api.post('/api/organizer/request-password-reset', data),
  getMyPasswordResetRequests: () => api.get('/api/organizer/password-requests'),
  
  // Get dashboard
  getDashboard: () => api.get('/api/organizer/dashboard'),
  
  // Create event
  createEvent: (data) => api.post('/api/events', data),
  
  // Get my events
  getMyEvents: (params) => api.get('/api/organizer/events', { params }),
  
  // Get event details
  getEventDetails: (id) => api.get(`/api/organizer/events/${id}`),
  
  // Update event
  updateEvent: (id, data) => api.put(`/api/organizer/events/${id}`, data),
  
  // Publish event
  publishEvent: (id) => api.post(`/api/organizer/events/${id}/publish`),
  
  // Close event
  closeEvent: (id) => api.post(`/api/organizer/events/${id}/close`),
  
  // Complete event
  completeEvent: (id) => api.post(`/api/organizer/events/${id}/complete`),
  
  // Delete event
  deleteEvent: (id) => api.delete(`/api/organizer/events/${id}`),
  
  // Get event registrations
  getEventRegistrations: (id, params) => api.get(`/api/organizer/events/${id}/registrations`, { params }),
  
  // Export registrations
  exportRegistrations: (id) => api.get(`/api/organizer/events/${id}/export`, { responseType: 'blob' }),
  
  // Approve merchandise payment
  approveMerchandisePayment: (id) => api.post(`/api/organizer/registrations/${id}/approve`),
  
  // Reject merchandise payment
  rejectMerchandisePayment: (id, data) => api.post(`/api/organizer/registrations/${id}/reject`, data),
  
  // Verify ticket (QR scanning)
  verifyTicket: (ticketId) => api.post('/api/organizer/verify-ticket', { ticketId }),
};

// ============================================
// ADMIN APIs
// ============================================

export const adminAPI = {
  // Get system stats
  getSystemStats: () => api.get('/api/admin/stats'),
  
  // Create organizer
  createOrganizer: (data) => api.post('/api/admin/organizers', data),
  
  // Get all organizers
  getAllOrganizers: () => api.get('/api/admin/organizers'),
  
  // Get organizer details
  getOrganizerDetails: (id) => api.get(`/api/admin/organizers/${id}`),
  
  // Update organizer
  updateOrganizer: (id, data) => api.put(`/api/admin/organizers/${id}`, data),
  
  // Toggle organizer status
  toggleOrganizerStatus: (id) => api.put(`/api/admin/organizers/${id}/toggle`),
  
  // Delete organizer
  deleteOrganizer: (id) => api.delete(`/api/admin/organizers/${id}`),
  
  // Reset organizer password
  resetOrganizerPassword: (id) => api.post(`/api/admin/organizers/${id}/reset-password`),
  
  // Password reset requests
  getPasswordResetRequests: () => api.get('/api/admin/password-requests'),
  approvePasswordResetRequest: (id, data) => api.post(`/api/admin/password-requests/${id}/approve`, data),
  rejectPasswordResetRequest: (id, data) => api.post(`/api/admin/password-requests/${id}/reject`, data),
};

// ============================================
// DISCUSSION APIs
// ============================================

export const discussionAPI = {
  // Get all discussions for an event
  getEventDiscussions: (eventId) => api.get(`/api/discussions/event/${eventId}`),
  
  // Post a new discussion message
  postDiscussion: (eventId, data) => api.post(`/api/discussions/event/${eventId}`, data),
  
  // Post a reply to a discussion
  postReply: (discussionId, data) => api.post(`/api/discussions/${discussionId}/reply`, data),
  
  // Toggle like on a discussion
  toggleLike: (discussionId) => api.put(`/api/discussions/${discussionId}/like`),
  
  // Delete a discussion
  deleteDiscussion: (discussionId) => api.delete(`/api/discussions/${discussionId}`),
  
  // Pin/unpin a discussion (organizer only)
  togglePin: (discussionId) => api.put(`/api/discussions/${discussionId}/pin`),
};

// ============================================
// FEEDBACK APIs
// ============================================

export const feedbackAPI = {
  // Submit feedback for an event
  submitFeedback: (registrationId, data) => api.post(`/api/feedback/${registrationId}`, data),
  
  // Check if feedback submitted
  checkFeedbackStatus: (registrationId) => api.get(`/api/feedback/check/${registrationId}`),
  
  // Get event feedback (organizer only)
  getEventFeedback: (eventId) => api.get(`/api/feedback/event/${eventId}`),
};

export default api;
