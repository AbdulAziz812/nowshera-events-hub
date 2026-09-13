import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../api";


function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        );
      }


      localStorage.setItem(
  "access_token",
  data.access_token
);

localStorage.setItem(
  "refresh_token",
  data.refresh_token
);

localStorage.setItem(
  "user",
  JSON.stringify(data.user)
);


      if (data.user.role === "Admin") {
        navigate("/admin");
      } else {
        navigate("/events");
      }

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="auth-page">

      <div className="auth-card">


        <p className="hero-small-text">
  Nowshera Events Hub
</p>
        <h1>Welcome Back</h1>

        <p>
          Sign in to your account.
        </p>


        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

          </div>


          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

          </div>


          <button
            type="submit"
            className="primary-button full-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>


        <p className="auth-footer">

          Don't have an account?{" "}

          <Link to="/signup">
            Sign Up
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;