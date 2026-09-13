import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, apiFetch } from "../api";


function AdminEvents() {
  const token = localStorage.getItem("access_token");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingEventId, setEditingEventId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    capacity: "",
    status: "Draft"
  });


  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API_URL}/admin/events`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

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


  useEffect(() => {
    loadEvents();
  }, []);


  function resetForm() {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      event_time: "",
      location: "",
      capacity: "",
      status: "Draft"
    });

    setEditingEventId(null);
  }


  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });
  }


  function handleEdit(eventItem) {
    setEditingEventId(eventItem.id);

    setFormData({
      title: eventItem.title,
      description: eventItem.description,
      event_date: eventItem.event_date,
      event_time: eventItem.event_time,
      location: eventItem.location,
      capacity: eventItem.capacity,
      status: eventItem.status
    });

    setShowForm(true);

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  function handleCloseForm() {
    setShowForm(false);
    resetForm();
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const isEditing = editingEventId !== null;

      const url = isEditing
        ? `${API_URL}/events/${editingEventId}`
        : `${API_URL}/events`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await apiFetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          event_date: formData.event_date,
          event_time: formData.event_time,
          location: formData.location,
          capacity: Number(formData.capacity),
          status: formData.status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          (
            isEditing
              ? "Unable to update event"
              : "Unable to create event"
          )
        );
      }

      setMessage(
        isEditing
          ? "Event updated successfully."
          : "Event created successfully."
      );

      setShowForm(false);
      resetForm();

      await loadEvents();

    } catch (error) {
      setError(error.message);

    } finally {
      setSaving(false);
    }
  }


  async function handleStatusChange(eventId, newStatus) {
    if (!newStatus) {
      return;
    }

    const confirmed = window.confirm(
      `Change event status to ${newStatus}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `${API_URL}/events/${eventId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to change event status"
        );
      }

      setMessage(
        `Event status changed to ${newStatus}.`
      );

      await loadEvents();

    } catch (error) {
      setError(error.message);
    }
  }


  function getAllowedStatuses(eventItem) {
    if (eventItem.status === "Draft") {
      return ["Published", "Cancelled"];
    }

    if (eventItem.status === "Published") {
      return ["Completed", "Cancelled"];
    }

    return [];
  }


  return (
    <div className="page-container">

      <div className="admin-page-header">

        <div>
          <p className="page-label">
            Admin
          </p>

          <h1>
            Event Management
          </h1>

          <p>
            Create and manage events.
          </p>
        </div>


        <button
          className="primary-button"
          onClick={() => {
            if (showForm) {
              handleCloseForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
        >
          {showForm
            ? "Close Form"
            : "Create Event"}
        </button>

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


      {showForm && (
        <div className="admin-form-card">

          <h2>
            {editingEventId
              ? "Edit Event"
              : "Create New Event"}
          </h2>


          <form onSubmit={handleSubmit}>

            <div className="admin-form-grid">

              <div className="form-group">
                <label>Title</label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>Location</label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>Date</label>

                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>Time</label>

                <input
                  type="time"
                  name="event_time"
                  value={formData.event_time}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>Capacity</label>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
              </div>


              {!editingEventId && (
                <div className="form-group">

                  <label>Status</label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Draft">
                      Draft
                    </option>

                    <option value="Published">
                      Published
                    </option>

                  </select>

                </div>
              )}

            </div>


            <div className="form-group">

              <label>Description</label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                required
              />

            </div>


            <div className="form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingEventId
                    ? "Update Event"
                    : "Create Event"}
              </button>


              {editingEventId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCloseForm}
                >
                  Cancel Edit
                </button>
              )}

            </div>

          </form>

        </div>
      )}


      {loading ? (

        <p>
          Loading events...
        </p>

      ) : events.length === 0 ? (

        <div className="empty-state">

          <h3>
            No events found
          </h3>

          <p>
            Create your first event to get started.
          </p>

        </div>

      ) : (

        <div className="admin-events-table-wrapper">

          <table className="admin-events-table">

            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
                <th>Capacity</th>
                <th>Registered</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>


            <tbody>

              {events.map((eventItem) => {

                const allowedStatuses =
                  getAllowedStatuses(eventItem);

                return (
                  <tr key={eventItem.id}>

                    <td>

                      <strong>
                        {eventItem.title}
                      </strong>

                      <div className="table-location">
                        {eventItem.location}
                      </div>

                    </td>


                    <td>
                      {eventItem.event_date}
                      <br />
                      {eventItem.event_time}
                    </td>


                    <td>

                      <span
                        className={
                          `status-badge status-${eventItem.status.toLowerCase()}`
                        }
                      >
                        {eventItem.status}
                      </span>

                    </td>


                    <td>
                      {eventItem.capacity}
                    </td>


                    <td>
                      {eventItem.registered_count}
                    </td>


                    <td>
                      {eventItem.available_capacity}
                    </td>


                    <td>

                      <div className="table-actions">

                        <button
                          className="table-action-button"
                          onClick={() =>
                            handleEdit(eventItem)
                          }
                          disabled={
                            eventItem.status === "Completed" ||
                            eventItem.status === "Cancelled"
                          }
                        >
                          Edit
                        </button>


                        <Link
                          to={
                            `/admin/events/${eventItem.id}/attendees`
                          }
                          className="table-link"
                        >
                          Attendees
                        </Link>

                        <Link
                            to={
                                `/admin/events/${eventItem.id}/report`
                            }
                            className="table-link"
                        >
                            Report
                        </Link>


                        {allowedStatuses.length > 0 && (
                          <select
                            className="status-select"
                            defaultValue=""
                            onChange={(event) => {
                              handleStatusChange(
                                eventItem.id,
                                event.target.value
                              );

                              event.target.value = "";
                            }}
                          >

                            <option value="">
                              Change Status
                            </option>

                            {allowedStatuses.map((status) => (

                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>

                            ))}

                          </select>
                        )}

                      </div>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default AdminEvents;