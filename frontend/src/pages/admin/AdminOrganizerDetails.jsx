import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './AdminOrganizerDetails.css';

function AdminOrganizerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [organizer, setOrganizer] = useState(null);
  const [stats, setStats] = useState(null);
  const [presentEvents, setPresentEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrganizer = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminAPI.getOrganizerDetails(id);
        const data = response.data;

        setOrganizer(data.organizer || null);
        setStats(data.stats || null);
        setPresentEvents(data.presentEvents || []);
        setUpcomingEvents(data.upcomingEvents || []);
        setPastEvents(data.pastEvents || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load organizer details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizer();
  }, [id]);

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-IN', options)} - ${endDate.toLocaleDateString('en-IN', options)}`;
  };

  const renderEvents = (events, emptyText) => {
    if (!events.length) return <p className="empty-events">{emptyText}</p>;

    return (
      <div className="events-grid">
        {events.map((event) => (
          <div key={event._id} className="event-card">
            <h4>{event.eventName}</h4>
            <p>{event.description?.substring(0, 120)}{event.description?.length > 120 ? '...' : ''}</p>
            <div className="event-meta">
              <span>Status: {event.status}</span>
              <span>{event.eventType}</span>
            </div>
            <div className="event-meta">
              <span>{formatDateRange(event.eventStartDate, event.eventEndDate)}</span>
              <span>Regs: {event.currentRegistrations}{event.registrationLimit ? `/${event.registrationLimit}` : ''}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="admin-organizer-details">Loading organizer details...</div>;
  }

  return (
    <div className="admin-organizer-details">
      <button className="back-btn" onClick={() => navigate('/admin/manage-organizers')}>
        ← Back to Manage Organizers
      </button>

      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="organizer-header">
            <h1>{organizer?.organizerName || 'Organizer'}</h1>
            {organizer?.category && <span className="organizer-category">{organizer.category}</span>}
            <p>{organizer?.description || organizer?.organizerDescription || 'No description available.'}</p>
            <p>Email: {organizer?.email}</p>
            {organizer?.contactEmail && <p>Contact: {organizer.contactEmail}</p>}
          </div>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card"><span>Total Events</span><strong>{stats.totalEvents}</strong></div>
              <div className="stat-card"><span>Published</span><strong>{stats.publishedEvents}</strong></div>
              <div className="stat-card"><span>Ongoing</span><strong>{stats.ongoingEvents}</strong></div>
              <div className="stat-card"><span>Completed</span><strong>{stats.completedEvents}</strong></div>
              <div className="stat-card"><span>Total Registrations</span><strong>{stats.totalRegistrations}</strong></div>
            </div>
          )}

          <section className="events-section">
            <h2>Present Events</h2>
            {renderEvents(presentEvents, 'No present events.')}
          </section>

          <section className="events-section">
            <h2>Upcoming Events</h2>
            {renderEvents(upcomingEvents, 'No upcoming events.')}
          </section>

          <section className="events-section">
            <h2>Past Events</h2>
            {renderEvents(pastEvents, 'No past events.')}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminOrganizerDetails;
