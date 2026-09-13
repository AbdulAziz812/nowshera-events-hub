import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Events from "./pages/Events";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyRegistrations from "./pages/MyRegistrations";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEvents from "./pages/AdminEvents";
import EventDetails from "./pages/EventDetails";
import AdminAttendees from "./pages/AdminAttendees";
import AdminReport from "./pages/AdminReport";


function App() {
  return (
    <>
      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* Attendee */}

        <Route
          path="/my-registrations"
          element={
            <ProtectedRoute allowedRole="Attendee">
              <MyRegistrations />
            </ProtectedRoute>
          }
        />


        {/* Admin */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:eventId"
          element={<EventDetails />}
        />

        <Route
          path="/admin/events/:eventId/attendees"
          element={
          <ProtectedRoute allowedRole="Admin">
            <AdminAttendees />
          </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events/:eventId/report"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminReport />
            </ProtectedRoute>
          }
        />
        

      </Routes>
    </>
  );
}

export default App;