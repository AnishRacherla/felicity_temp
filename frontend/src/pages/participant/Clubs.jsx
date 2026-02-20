import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import './Clubs.css';

function Clubs() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await participantAPI.getOrganizers();
        setClubs(response.data.organizers || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  if (loading) {
    return (
      <div className="clubs-page">
        <div className="loading-state">Loading clubs...</div>
      </div>
    );
  }

  return (
    <div className="clubs-page">
      <div className="page-header">
        <h1>Clubs</h1>
        <p>Explore all clubs and view their events</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {clubs.length === 0 ? (
        <div className="empty-state">No clubs found.</div>
      ) : (
        <div className="clubs-grid">
          {clubs.map((club) => (
            <button
              key={club._id}
              className="club-card"
              onClick={() => navigate(`/clubs/${club._id}`)}
            >
              <div className="club-card-header">
                <h3>{club.organizerName || 'Unnamed Club'}</h3>
                {club.category && <span className="club-category">{club.category}</span>}
              </div>
              {club.description && (
                <p className="club-description">
                  {club.description.length > 140
                    ? `${club.description.substring(0, 140)}...`
                    : club.description}
                </p>
              )}
              {club.contactEmail && <p className="club-contact">Contact: {club.contactEmail}</p>}
              <span className="club-link">View club details →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Clubs;
