import { Link, useNavigate } from "react-router-dom";


function Navbar() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");

  let user = null;

  if (storedUser) {
    user = JSON.parse(storedUser);
  }


  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }


  return (
    <nav className="navbar">

      <div className="navbar-container">

        <Link
          to="/"
          className="logo"
        >
          Nowshera Events Hub
        </Link>


        <div className="nav-links">

          <Link to="/">
            Home
          </Link>


          {user?.role !== "Admin" && (
            <Link to="/events">
              Events
            </Link>
          )}


          {!user && (
            <>
              <Link to="/login">
                Login
              </Link>

              <Link
                to="/signup"
                className="signup-button"
              >
                Sign Up
              </Link>
            </>
          )}


          {user?.role === "Attendee" && (
            <>
              <Link to="/my-registrations">
                My Registrations
              </Link>

              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            </>
          )}


          {user?.role === "Admin" && (
            <>
              <Link to="/admin">
                Dashboard
              </Link>

              <Link to="/admin/events">
                Manage Events
              </Link>

              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            </>
          )}

        </div>

      </div>

    </nav>
  );
}

export default Navbar;