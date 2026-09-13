import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";


function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch(`${API_URL}/events`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load events"
          );
        }

        setEvents(data);

      } catch (error) {
        setError(error.message);

      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);


  if (loading) {
    return (
      <div className="page-container">
        <p>Loading upcoming events...</p>
      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="page-heading">
        <p className="page-label">
          Events
        </p>

        <h1>Upcoming Events</h1>

        <p>
          Discover upcoming events and reserve your place.
        </p>
      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {!error && events.length === 0 && (
        <div className="empty-state">
          <h3>No upcoming events</h3>

          <p>
            There are currently no published upcoming events.
          </p>
        </div>
      )}


      <div className="events-grid">

        {events.map((event) => (
          <div
            className="event-card"
            key={event.id}
          >

            <div className="event-card-header">
              <span className="event-status">
                {event.status}
              </span>
            </div>


            <h2>{event.title}</h2>

            <p className="event-description">
              {event.description}
            </p>


            <div className="event-information">

              <p>
                <strong>Date:</strong>{" "}
                {event.event_date}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {event.event_time}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {event.location}
              </p>

              <p>
                <strong>Available Places:</strong>{" "}
                {event.available_capacity}
              </p>

            </div>


            <Link
              to={`/events/${event.id}`}
              className="primary-button event-button"
            >
              View Details
            </Link>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Events;