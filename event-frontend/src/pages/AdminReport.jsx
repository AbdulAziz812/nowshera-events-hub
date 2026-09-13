import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL, apiFetch } from "../api";


function AdminReport() {
  const { eventId } = useParams();

  const token = localStorage.getItem("access_token");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  useEffect(() => {
    async function loadReport() {
      try {
        const response = await apiFetch(
          `${API_URL}/admin/reports/events/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load report"
          );
        }

        setReport(data);

      } catch (error) {
        setError(error.message);

      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [eventId, token]);


  async function handleCopyAttendees() {
    if (!report) {
      return;
    }

    if (report.attendees.length === 0) {
      setError("There are no active attendees to copy.");
      return;
    }

    const attendeeText = report.attendees
      .map((attendee, index) => {
        return `${index + 1}. ${attendee.name} - ${attendee.email}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(attendeeText);

      setError("");
      setMessage("Attendee list copied successfully.");

    } catch {
      setError("Unable to copy attendee list.");
    }
  }


  function handleExportCSV() {
    if (!report) {
      return;
    }

    if (report.attendees.length === 0) {
      setError("There are no active attendees to export.");
      return;
    }

    const csvRows = [
      [
        "No.",
        "Name",
        "Email",
        "Registered At"
      ]
    ];


    report.attendees.forEach((attendee, index) => {
      csvRows.push([
        index + 1,
        attendee.name,
        attendee.email,
        new Date(
          attendee.registered_at
        ).toLocaleString()
      ]);
    });


    const csvContent = csvRows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");

            return `"${text.replaceAll('"', '""')}"`;
          })
          .join(",")
      )
      .join("\n");


    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;"
      }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `${report.event.title
        .replaceAll(" ", "_")
        .toLowerCase()}_attendees.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setError("");
    setMessage("CSV exported successfully.");
  }


  if (loading) {
    return (
      <div className="page-container">
        <p>Loading report...</p>
      </div>
    );
  }


  if (!report) {
    return (
      <div className="page-container">
        <div className="error-message">
          {error || "Report not available"}
        </div>
      </div>
    );
  }


  const { event, summary, attendees } = report;


  return (
    <div className="page-container">

      <div className="report-page-header">

        <div>
          <p className="page-label">
            Admin Report
          </p>

          <h1>
            {event.title}
          </h1>

          <p>
            Registration and attendance summary.
          </p>
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


      {message && (
        <div className="success-message">
          {message}
        </div>
      )}


      <div className="report-event-details">

        <div>
          <span>Date</span>
          <strong>
            {event.event_date}
          </strong>
        </div>

        <div>
          <span>Time</span>
          <strong>
            {event.event_time}
          </strong>
        </div>

        <div>
          <span>Location</span>
          <strong>
            {event.location}
          </strong>
        </div>

        <div>
          <span>Status</span>

          <strong>
            {event.status}
          </strong>
        </div>

      </div>


      <div className="report-summary-grid">

        <div className="report-summary-card">
          <span>Capacity</span>

          <strong>
            {summary.capacity}
          </strong>
        </div>


        <div className="report-summary-card">
          <span>Active Registrations</span>

          <strong>
            {summary.active_registrations}
          </strong>
        </div>


        <div className="report-summary-card">
          <span>Cancelled Registrations</span>

          <strong>
            {summary.cancelled_registrations}
          </strong>
        </div>


        <div className="report-summary-card">
          <span>Available Capacity</span>

          <strong>
            {summary.available_capacity}
          </strong>
        </div>

      </div>


      <div className="report-attendee-section">

        <div className="report-attendee-header">

          <div>
            <h2>
              Active Attendees
            </h2>

            <p>
              {attendees.length} attendee
              {attendees.length !== 1 ? "s" : ""}
            </p>
          </div>


          <div className="report-actions">

            <button
              className="secondary-button"
              onClick={handleCopyAttendees}
            >
              Copy Attendee List
            </button>


            <button
              className="primary-button"
              onClick={handleExportCSV}
            >
              Export CSV
            </button>

          </div>

        </div>


        {attendees.length === 0 ? (

          <div className="empty-state">

            <h3>
              No active attendees
            </h3>

            <p>
              There are currently no active registrations
              for this event.
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

    </div>
  );
}

export default AdminReport;