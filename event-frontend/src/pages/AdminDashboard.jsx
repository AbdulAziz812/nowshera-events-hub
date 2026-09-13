import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "../api";


function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");


  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await apiFetch(
          `${API_URL}/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load dashboard"
          );
        }

        setDashboard(data);

      } catch (error) {
        setError(error.message);

      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [token]);


  if (loading) {
    return (
      <div className="page-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="page-heading">
        <p className="page-label">
          Admin
        </p>

        <h1>
          Dashboard
        </h1>

        <p>
          Overview of events, registrations,
          and available capacity.
        </p>
      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {dashboard && (
        <>
          <div className="dashboard-grid">

            <div className="dashboard-card">
              <span>Total Events</span>
              <strong>
                {dashboard.events.total}
              </strong>
            </div>

            <div className="dashboard-card">
              <span>Active Registrations</span>
              <strong>
                {dashboard.registrations.active}
              </strong>
            </div>

            <div className="dashboard-card">
              <span>Available Capacity</span>
              <strong>
                {dashboard.capacity.available}
              </strong>
            </div>

          </div>


          <div className="dashboard-section">

            <h2>Event Status</h2>

            <div className="dashboard-grid four-columns">

              <div className="dashboard-card small-card">
                <span>Draft</span>
                <strong>
                  {dashboard.events.draft}
                </strong>
              </div>

              <div className="dashboard-card small-card">
                <span>Published</span>
                <strong>
                  {dashboard.events.published}
                </strong>
              </div>

              <div className="dashboard-card small-card">
                <span>Completed</span>
                <strong>
                  {dashboard.events.completed}
                </strong>
              </div>

              <div className="dashboard-card small-card">
                <span>Cancelled</span>
                <strong>
                  {dashboard.events.cancelled}
                </strong>
              </div>

            </div>

          </div>


          <div className="dashboard-section">

            <h2>Registration Summary</h2>

            <div className="dashboard-grid">

              <div className="dashboard-card small-card">
                <span>Active</span>
                <strong>
                  {dashboard.registrations.active}
                </strong>
              </div>

              <div className="dashboard-card small-card">
                <span>Cancelled</span>
                <strong>
                  {dashboard.registrations.cancelled}
                </strong>
              </div>

              <div className="dashboard-card small-card">
  <span>Closed Events</span>
  <strong>
    {dashboard.registrations.total -
      dashboard.registrations.active -
      dashboard.registrations.cancelled}
  </strong>
</div>

              <div className="dashboard-card small-card">
                <span>Total</span>
                <strong>
                  {dashboard.registrations.total}
                </strong>
              </div>

            </div>

          </div>


          <div className="dashboard-section">

            <h2>Capacity Summary</h2>

            <div className="dashboard-grid">

              <div className="dashboard-card small-card">
                <span>Total Capacity</span>
                <strong>
                  {dashboard.capacity.total}
                </strong>
              </div>

              <div className="dashboard-card small-card">
                <span>Available Capacity</span>
                <strong>
                  {dashboard.capacity.available}
                </strong>
              </div>

            </div>

          </div>

        </>
      )}

    </div>
  );
}

export default AdminDashboard;