import { Navigate } from "react-router-dom";


function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("access_token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "Admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/events" replace />;
  }

  return children;
}

export default ProtectedRoute;