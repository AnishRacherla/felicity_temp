/**
 * APP.JSX - Main React Application Component
 * 
 * This is the ROOT component of our entire frontend
 * Everything in our app is inside this component
 * 
 * Structure:
 * - Router setup (different pages)
 * - Authentication context (login state)
 * - Navigation (navbar)
 * - Page routing (show different pages based on URL)
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import MyRegistrations from './pages/participant/MyRegistrations';
import FollowOrganizers from './pages/participant/FollowOrganizers';
import ParticipantProfile from './pages/participant/ParticipantProfile';
import EventDiscussion from './pages/participant/EventDiscussion';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import ManageEvents from './pages/organizer/ManageEvents';
import EditEvent from './pages/organizer/EditEvent';
import OrganizerEventDetails from './pages/organizer/OrganizerEventDetails';
import ScanTickets from './pages/organizer/ScanTickets';
import OrganizerProfile from './pages/organizer/OrganizerProfile';
import PaymentApprovals from './pages/organizer/PaymentApprovals';
import EventFeedback from './pages/organizer/EventFeedback';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';
import DebugAuth from './pages/DebugAuth';

// Import components
import Navbar from './components/Navbar';
import './App.css';

/**
 * PROTECTED ROUTE - Only allow logged-in users
 * If not logged in → Redirect to login page
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.error('Access denied. User role:', user.role, 'Allowed roles:', allowedRoles);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Your role ({user.role}) doesn't have access to this page.</p>
        <p>Required role: {allowedRoles.join(', ')}</p>
      </div>
    );
  }

  return children;
}

/**
 * MAIN APP COMPONENT
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          
          <main className="main-content">
            <Routes>
              {/* Public routes (anyone can access) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/debug" element={<DebugAuth />} />

              {/* Protected routes (must be logged in) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['participant']}>
                    <ParticipantDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Browse Events - Available to logged-in participants */}
              <Route 
                path="/browse-events" 
                element={
                  <ProtectedRoute allowedRoles={['participant']}>
                    <BrowseEvents />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/events/:id" 
                element={
                  <ProtectedRoute allowedRoles={['participant']}>
                    <EventDetails />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/registrations" 
                element={
                  <ProtectedRoute allowedRoles={['participant']}>
                    <MyRegistrations />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/follow-organizers" 
                element={
                  <ProtectedRoute allowedRoles={['participant']}>
                    <FollowOrganizers />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute allowedRoles={['participant']}>
                    <ParticipantProfile />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/events/:eventId/discussion" 
                element={
                  <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                    <EventDiscussion />
                  </ProtectedRoute>
                } 
              />

              {/* Organizer Routes - For club heads who create/manage events */}
              <Route 
                path="/organizer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/create-event" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <CreateEvent />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/events" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <ManageEvents />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/events/:id/edit" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <EditEvent />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/events/:id/details" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerEventDetails />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/events/:eventId/payment-approvals" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <PaymentApprovals />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/profile" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerProfile />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/scan-tickets" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <ScanTickets />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/events/:eventId/feedback" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <EventFeedback />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes - For system administrators */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/manage-organizers" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageOrganizers />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/password-requests" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PasswordResetRequests />
                  </ProtectedRoute>
                } 
              />

              {/* Default route */}
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
