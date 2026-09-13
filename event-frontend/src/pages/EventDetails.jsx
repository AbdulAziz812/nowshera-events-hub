import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, apiFetch } from "../api";


function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const token = localStorage.getItem("access_token");
  const storedUser = localStorage.getItem("user");

  let user = null;

  if (storedUser) {
    user = JSON.parse(storedUser);
  }


  async function loadEvent() {
    try {
      const response = await fetch(
  `${API_URL}/events/${eventId}`
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load event"
        );
      }

      setEvent(data);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadEvent();
  }, [eventId]);


  async function handleRegister() {
    setError("");
    setMessage("");


    if (!token || !user) {
      navigate("/login");
      return;
    }


    if (user.role !== "Attendee") {
      setError(
        "Only attendees can register for events."
      );
      return;
    }


    setRegistering(true);

    try {
      const response = await apiFetch(
        `${API_URL}/events/${eventId}/register`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed"
        );
      }

      setMessage(
  data.message || "Registration successful."
);

await loadEvent();

    } catch (error) {
      setError(error.message);

    } finally {
      setRegistering(false);
    }
  }


  if (loading) {
    return (
      <div className="page-container">
        <p>Loading event...</p>
      </div>
    );
  }


  if (!event) {
    return (
      <div className="page-container">

        <div className="error-message">
          {error || "Event not found"}
        </div>

      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="event-details-card">

        <div className="event-details-header">

          <div>

            <p className="page-label">
              Event Details
            </p>

            <h1>{event.title}</h1>

          </div>


          <span className="event-status">
            {event.status}
          </span>

        </div>


        <p className="event-details-description">
          {event.description}
        </p>


        <div className="event-details-grid">

          <div className="detail-box">
            <span>Date</span>
            <strong>{event.event_date}</strong>
          </div>

          <div className="detail-box">
            <span>Time</span>
            <strong>{event.event_time}</strong>
          </div>

          <div className="detail-box">
            <span>Location</span>
            <strong>{event.location}</strong>
          </div>

          <div className="detail-box">
            <span>Available Places</span>
            <strong>
              {event.available_capacity}
            </strong>
          </div>

        </div>


        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        {message && (
          <div className="success-message">
            {message}
          </div>
        )}


        <div className="event-details-actions">

          {event.available_capacity > 0 ? (

            <button
              onClick={handleRegister}
              className="primary-button"
              disabled={registering}
            >
              {registering
                ? "Registering..."
                : "Register for Event"}
            </button>

          ) : (

            <button
              className="primary-button"
              disabled
            >
              Event Full
            </button>

          )}

        </div>

      </div>

    </div>
  );
}

export default EventDetails;