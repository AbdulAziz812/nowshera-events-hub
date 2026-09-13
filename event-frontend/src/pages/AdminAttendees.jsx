import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL, apiFetch } from "../api";


function AdminAttendees() {
  const { eventId } = useParams();

  const token = localStorage.getItem("access_token");

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  async function loadAttendees(searchText = "") {
    setLoading(true);
    setError("");

    try {
      let url =
        `${API_URL}/admin/events/${eventId}/attendees`;

      if (searchText.trim()) {
        url += `?search=${encodeURIComponent(searchText)}`;
      }


      const response = await apiFetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load attendees"
        );
      }

      setEvent(data.event);
      setAttendees(data.attendees);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadAttendees();
  }, [eventId]);


  function handleSearch(event) {
    event.preventDefault();

    loadAttendees(search);
  }


  function handleClearSearch() {
    setSearch("");
    loadAttendees("");
  }


  return (
    <div className="page-container">

      <div className="attendee-page-header">

        <div>
          <p className="page-label">
            Admin
          </p>

          <h1>
            Event Attendees
          </h1>

          {event && (
            <p>
              {event.title}
            </p>
          )}
        </div>


        <Link
          to="/admin/events"
          className="secondary-button"
        >
          Back to Events
        </Link>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {event && (
        <div className="attendee-event-summary">

          <div>
            <span>Date</span>
            <strong>{event.event_date}</strong>
          </div>

          <div>
            <span>Time</span>
            <strong>{event.event_time}</strong>
          </div>

          <div>
            <span>Location</span>
            <strong>{event.location}</strong>
          </div>

          <div>
            <span>Capacity</span>
            <strong>{event.capacity}</strong>
          </div>

        </div>
      )}


      <div className="attendee-toolbar">

        <form
          className="attendee-search"
          onSubmit={handleSearch}
        >

          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />


          <button
            type="submit"
            className="primary-button"
          >
            Search
          </button>


          {search && (
            <button
              type="button"
              className="secondary-button"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}

        </form>

      </div>


      {loading ? (

        <p>
          Loading attendees...
        </p>

      ) : attendees.length === 0 ? (

        <div className="empty-state">

          <h3>
            No attendees found
          </h3>

          <p>
            There are no active registrations matching your search.
          </p>

        </div>

      ) : (

        <div className="attendee-table-wrapper">

          <table className="attendee-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Registered At</th>
              </tr>
            </thead>


            <tbody>

              {attendees.map((attendee, index) => (

                <tr key={attendee.registration_id}>

                  <td>
                    {index + 1}
                  </td>

                  <td>
                    <strong>
                      {attendee.name}
                    </strong>
                  </td>

                  <td>
                    {attendee.email}
                  </td>

                  <td>
                    {new Date(
                      attendee.registered_at
                    ).toLocaleString()}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

export default AdminAttendees;