import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import './ClubDetails.css';

function ClubDetails() {
  const { organizerId } = useParams();
  const navigate = useNavigate();

  const [organizer, setOrganizer] = useState(null);
  const [presentEvents, setPresentEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await participantAPI.getOrganizerDetails(organizerId);
        const data = response.data;

        setOrganizer(data.organizer || null);
        setPresentEvents(data.presentEvents || []);
        setUpcomingEvents(data.upcomingEvents || []);
        setPastEvents(data.pastEvents || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load club details');
      } finally {
        setLoading(false);
      }
    };

    fetchClubDetails();
  }, [organizerId]);

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-IN', options)} - ${endDate.toLocaleDateString('en-IN', options)}`;
  };

  const renderEvents = (events, emptyText) => {
    if (!events.length) {
      return <p className="empty-events">{emptyText}</p>;
    }

    return (
      <div className="events-grid">
        {events.map((event) => (
          <button
            key={event._id}
            className="event-card"
            onClick={() => navigate(`/events/${event._id}`)}
          >
            <h4>{event.eventName}</h4>
            <p>{event.description?.substring(0, 110)}{event.description?.length > 110 ? '...' : ''}</p>
            <div className="event-meta">
              <span>{event.eventType}</span>
              <span>{formatDateRange(event.eventStartDate, event.eventEndDate)}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="club-details-page">
        <div className="loading-state">Loading club details...</div>
      </div>
    );
  }

  return (
    <div className="club-details-page">
      <button className="back-btn" onClick={() => navigate('/clubs')}>
        ← Back to Clubs
      </button>

      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="club-header-card">
            <h1>{organizer?.organizerName || 'Club'}</h1>
            {organizer?.category && <span className="club-category">{organizer.category}</span>}
            {(organizer?.description || organizer?.organizerDescription) && (
              <p>{organizer.description || organizer.organizerDescription}</p>
            )}
            {organizer?.contactEmail && <p className="club-contact">Contact: {organizer.contactEmail}</p>}
          </div>

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

export default ClubDetails;
