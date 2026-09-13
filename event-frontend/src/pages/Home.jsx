import { Link } from "react-router-dom";


function Home() {
  const storedUser = localStorage.getItem("user");

  let user = null;

  if (storedUser) {
    user = JSON.parse(storedUser);
  }


  return (
    <main>

      <section className="hero">

        <div className="hero-content">

          <p className="hero-small-text">
            Nowshera Events Hub
          </p>

          <h1>
            Discover and Register
            for Upcoming Events
          </h1>

          <p className="hero-description">
            Browse upcoming events, reserve your place,
            and manage your registrations easily.
          </p>


          <div className="hero-buttons">

            {!user && (
              <>
                <Link
                  to="/events"
                  className="primary-button"
                >
                  Browse Events
                </Link>

                <Link
                  to="/signup"
                  className="secondary-button"
                >
                  Create Account
                </Link>
              </>
            )}


            {user?.role === "Attendee" && (
              <>
                <Link
                  to="/events"
                  className="primary-button"
                >
                  Browse Events
                </Link>

                <Link
                  to="/my-registrations"
                  className="secondary-button"
                >
                  My Registrations
                </Link>
              </>
            )}


            {user?.role === "Admin" && (
              <>
                <Link
                  to="/admin"
                  className="primary-button"
                >
                  Admin Dashboard
                </Link>

                <Link
                  to="/admin/events"
                  className="secondary-button"
                >
                  Manage Events
                </Link>
              </>
            )}

          </div>

        </div>

      </section>


      <section className="features">

        <h2>
          Simple Event Registration
        </h2>

        <div className="feature-grid">

          <div className="feature-card">
            <h3>Discover Events</h3>

            <p>
              Browse published upcoming events and
              find the ones that interest you.
            </p>
          </div>


          <div className="feature-card">
            <h3>Reserve Your Place</h3>

            <p>
              Register for available events quickly
              through your attendee account.
            </p>
          </div>


          <div className="feature-card">
            <h3>Manage Registrations</h3>

            <p>
              View your event registrations and
              cancel eligible bookings when needed.
            </p>
          </div>

        </div>

      </section>

    </main>
  );
}

export default Home;