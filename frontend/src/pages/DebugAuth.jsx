/**
 * DEBUG PAGE - Check authentication status and stored data
 * 
 * Visit this page to see:
 * - Current user data
 * - Token status
 * - LocalStorage contents
 * - API connection status
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventAPI } from '../services/api';

function DebugAuth() {
  const { user, loading } = useAuth();
  const [apiStatus, setApiStatus] = useState('checking...');
  const [eventsCount, setEventsCount] = useState(null);

  useEffect(() => {
    checkAPI();
  }, []);

  const checkAPI = async () => {
    try {
      const response = await eventAPI.browseEvents({});
      setApiStatus('✅ Connected');
      setEventsCount(response.events?.length || 0);
    } catch (error) {
      setApiStatus('❌ Not Connected - ' + error.message);
    }
  };

  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  let parsedStoredUser = null;
  try {
    parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    parsedStoredUser = 'Error parsing user data';
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 Authentication Debug Page</h1>
      
      <div style={{ marginTop: '30px' }}>
        <h2>AuthContext State</h2>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
          <p><strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}</p>
          <p><strong>User Object:</strong></p>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(user, null, 2) || 'null'}
          </pre>
          {user && (
            <>
              <p><strong>User Role:</strong> {user.role}</p>
              <p><strong>User Email:</strong> {user.email}</p>
              <p><strong>User Name:</strong> {user.firstName} {user.lastName}</p>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>LocalStorage Data</h2>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
          <p><strong>Token:</strong></p>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto', fontSize: '11px' }}>
            {storedToken || 'null'}
          </pre>
          <p><strong>Stored User:</strong></p>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(parsedStoredUser, null, 2) || 'null'}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>API Connection</h2>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
          <p><strong>Backend URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
          <p><strong>Status:</strong> {apiStatus}</p>
          {eventsCount !== null && <p><strong>Events in DB:</strong> {eventsCount}</p>}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Go to Login
          </button>
          <button 
            onClick={() => window.location.href = '/register'}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Go to Register
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#ff4444', color: 'white', border: 'none' }}
          >
            Clear LocalStorage & Reload
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>💡 What to Check:</h3>
        <ul>
          <li><strong>If user is null:</strong> You're not logged in. Go to Login/Register.</li>
          <li><strong>If user.role is undefined:</strong> Backend issue - check backend response.</li>
          <li><strong>If API status is ❌:</strong> Backend server is not running. Run: <code>cd backend && npm run dev</code></li>
          <li><strong>If events count is 0:</strong> No events in database. Run: <code>cd backend && node scripts/seedEvents.js</code></li>
        </ul>
      </div>
    </div>
  );
}

export default DebugAuth;
