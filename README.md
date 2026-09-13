# 🎟️ Nowshera Events Hub

**Nowshera Events Hub** is a full-stack event registration and management system developed for **Nowshera Events Co.**

The platform provides a simple way for attendees to discover and register for upcoming events while giving administrators complete control over event management, registrations, attendee lists, and reporting.

## ✨ Features

### 👤 Attendee
- Create an attendee account
- Secure login and logout
- Browse published upcoming events
- View event details and available capacity
- Register for eligible events
- View personal registrations
- Cancel eligible registrations
- Automatic availability updates after registration or cancellation

### 🛠️ Admin
- Secure Admin authentication and authorization
- Admin dashboard
- Create and edit events
- Manage event lifecycle:
  - Draft
  - Published
  - Completed
  - Cancelled
- View event capacity and registration statistics
- View attendee lists for individual events
- Search attendees by name or email
- Generate event reports
- Copy attendee lists for practical check-in use
- Export attendee lists as CSV

## 🔐 Business Rules & Security

- Role-based access for **Admin** and **Attendee**
- Backend authorization for protected operations
- One active registration per attendee per event
- Duplicate registrations are prevented
- Registration is only allowed for published, upcoming events with available capacity
- Full, past, completed, and cancelled events cannot accept new registrations
- Cancelled registrations do not consume event capacity
- Event capacity cannot be reduced below the number of active registrations
- Completed and Cancelled events are terminal
- Attendees can only manage their own registrations
- Automatic access-token refresh for authenticated sessions

## 💻 Tech Stack

### Frontend
- React
- Vite
- React Router
- JavaScript
- HTML
- CSS

### Backend
- Python
- FastAPI

### Database & Authentication
- Supabase
- PostgreSQL
- Supabase Authentication

## 🏗️ Architecture

```text
React / Vite Frontend
        ↓
   FastAPI Backend
        ↓
Supabase / PostgreSQL
```

The frontend communicates with the FastAPI backend through REST API endpoints. The backend handles authorization, business rules, and database operations.

## 📄 Main Pages

- Home
- Login
- Signup
- Upcoming Events
- Event Details
- My Registrations
- Admin Dashboard
- Event Management
- Event Attendee List
- Event Reports

## 🧪 Testing

The application was tested using a comprehensive functional and end-to-end test suite covering:

- Authentication
- Role-based authorization
- Event creation and editing
- Event lifecycle rules
- Registration and cancellation
- Capacity management
- Registration ownership
- Attendee search
- Dashboard statistics
- Reports and CSV export
- Session/token refresh
- Data persistence
- Error and empty states
- UI and usability

**All executed test cases passed successfully. ✅**

## 🚀 Running Locally

### Frontend

```bash
npm install
npm run dev
```

### Backend

Start the FastAPI development server:

```bash
uvicorn main:app --reload
```

The project requires valid Supabase configuration/environment variables for the backend.

## 👩‍💻 Developer

Developed as a full-stack web application using **React, FastAPI, PostgreSQL, and Supabase**.

---

⭐ If you find this project useful, feel free to star the repository.