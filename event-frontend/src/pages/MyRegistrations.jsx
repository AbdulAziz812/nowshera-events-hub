import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "../api";


function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");


  async function loadRegistrations() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API_URL}/my-registrations`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load registrations"
        );
      }

      setRegistrations(data);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadRegistrations();
  }, []);


  async function handleCancel(registrationId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this registration?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `${API_URL}/registrations/${registrationId}/cancel`,
        {
          method: "PATCH",

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to cancel registration"
        );
      }

      setMessage(
        data.message || "Registration cancelled successfully."
      );

      await loadRegistrations();

    } catch (error) {
      setError(error.message);
    }
  }


  if (loading) {
    return (
      <div className="page-container">
        <p>Loading your registrations...</p>
      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="page-heading">

        <p className="page-label">
          Attendee
        </p>

        <h1>
          My Registrations
        </h1>

        <p>
          View and manage your event registrations.
        </p>

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


      {registrations.length === 0 ? (

        <div className="empty-state">

          <h3>No registrations yet</h3>

          <p>
            You have not registered for any events.
          </p>

        </div>

      ) : (

        <div className="registrations-list">

          {registrations.map((registration) => {

            const event = registration.events;

            const eventDateTime = new Date(
            `${event.event_date}T${event.event_time}`
);

            const canCancel =
            registration.status === "Registered" &&
                eventDateTime > new Date() &&
                event.status !== "Completed" &&
                event.status !== "Cancelled";

            return (
              <div
                className="registration-card"
                key={registration.id}
              >

                <div className="registration-card-content">

                  <div>

                    <span
  className={`registration-status ${
    registration.status === "Cancelled" ||
    event.status === "Cancelled"
      ? "cancelled-status"
      : event.status === "Completed"
      ? "completed-status"
      : "active-status"
  }`}
>
  {registration.status === "Cancelled"
    ? "Cancelled"
    : event.status === "Cancelled"
    ? "Event Cancelled"
    : event.status === "Completed"
    ? "Completed"
    : "Registered"}
</span>


                    <h2>
                      {event.title}
                    </h2>


                    <p className="registration-description">
                      {event.description}
                    </p>


                    <div className="registration-info">

                      <span>
                        <strong>Date:</strong>{" "}
                        {event.event_date}
                      </span>

                      <span>
                        <strong>Time:</strong>{" "}
                        {event.event_time}
                      </span>

                      <span>
                        <strong>Location:</strong>{" "}
                        {event.location}
                      </span>

                    </div>

                  </div>


                  <div className="registration-actions">

                    {canCancel && (
                      <button
                        className="cancel-button"
                        onClick={() =>
                          handleCancel(registration.id)
                        }
                      >
                        Cancel Registration
                      </button>
                    )}

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      )}

    </div>
  );
}

export default MyRegistrations;