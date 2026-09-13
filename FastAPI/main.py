import os

from fastapi import (
    FastAPI,
    HTTPException,
    status,
    Body,
    Header,
    Depends
)

from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime

# ----------------------------
# Environment setup
# ----------------------------



load_dotenv()

supabase_url = os.getenv("SUPABASE_URL", "").split("/rest/v1")[0].rstrip("/")
supabase_key = os.getenv("SUPABASE_KEY")


if not supabase_url or not supabase_key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")


supabase = create_client(
    supabase_url,
    supabase_key
)

security = HTTPBearer()
# ----------------------------
# FastAPI app
# ----------------------------

app = FastAPI(
    title="Event Registration & Management System"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------
# Test connection
# ----------------------------

@app.get("/")
def test_connection():

    return {
        "message": "FastAPI + Supabase connected successfully"
    }


# ----------------------------
# Signup
# ----------------------------

@app.post(
    "/signup",
    status_code=status.HTTP_201_CREATED
)
def signup(data: dict = Body(...)):

    name = data.get("name", "").strip()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")


    # Basic validation

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required"
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters"
        )


    try:

        # Create user in Supabase Auth

        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })


        if not auth_response.user:

            raise HTTPException(
                status_code=400,
                detail="Signup failed"
            )


        user_id = auth_response.user.id


        # Create application profile

        profile_data = {
        "id": user_id,
        "name": name,
        "email": email,
        "role": "Attendee"
        }


        supabase.table(
            "users"
        ).insert(
            profile_data
        ).execute()


        return {
            "message": "Account created successfully",
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": "Attendee"
            }
        }


    except HTTPException:
        raise


    except Exception as e:

        error_message = str(e).lower()


        if (
            "already registered" in error_message
            or
            "already exists" in error_message
        ):

            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists"
            )


        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ----------------------------
# Login
# ----------------------------

@app.post("/login")
def login(data: dict = Body(...)):

    email = data.get("email", "").lower().strip()
    password = data.get("password", "")


    if not email or not password:

        raise HTTPException(
            status_code=400,
            detail="Email and password are required"
        )


    try:

        auth_response = (
            supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
        )


        if (
            not auth_response.session
            or
            not auth_response.user
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )


        user_id = auth_response.user.id


        # Get profile and role

        profile_response = (
            supabase
            .table("users")
            .select("id, name, role")
            .eq("id", user_id)
            .execute()
        )


        if not profile_response.data:

            raise HTTPException(
                status_code=403,
                detail="User profile not found"
            )


        profile = profile_response.data[0]


        return {
            "message": "Login successful",

            "access_token":
                auth_response.session.access_token,

            "refresh_token":
                auth_response.session.refresh_token,

            "token_type": "bearer",

            "user": {
                "id": profile["id"],
                "name": profile["name"],
                "email": email,
                "role": profile["role"]
    }
}


    except HTTPException:
        raise


    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

@app.post("/refresh-token")
def refresh_token(data: dict = Body(...)):
    try:
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            raise HTTPException(
                status_code=400,
                detail="Refresh token is required"
            )

        response = supabase.auth.refresh_session(refresh_token)

        if not response.session:
            raise HTTPException(
                status_code=401,
                detail="Unable to refresh session"
            )

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )


# ----------------------------
# Get authenticated user
# ----------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        # Validate token with Supabase
        auth_response = supabase.auth.get_user(token)

        if not auth_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )

        user_id = auth_response.user.id

        # Get user's application profile
        profile_response = (
            supabase
            .table("users")
            .select("id, name, role")
            .eq("id", user_id)
            .execute()
        )

        if not profile_response.data:
            raise HTTPException(
                status_code=403,
                detail="User profile not found"
            )

        profile = profile_response.data[0]

        return {
            "id": profile["id"],
            "name": profile["name"],
            "email": auth_response.user.email,
            "role": profile["role"]
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# ----------------------------
# Current user endpoint
# ----------------------------

@app.get("/me")
def get_my_profile(
    current_user=Depends(get_current_user)
):
    return current_user


# ----------------------------
# Admin authorization
# ----------------------------

def require_admin(
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


# ----------------------------
# Admin test endpoint
# ----------------------------

@app.get("/admin/test")
def admin_test(
    admin=Depends(require_admin)
):

    return {
        "message": "Admin access successful",
        "admin": admin
    }


# ----------------------------
# Event helper
# ----------------------------

def event_is_future(event_date, event_time):

    try:
        event_datetime = datetime.strptime(
            f"{event_date} {event_time}",
            "%Y-%m-%d %H:%M:%S"
        )

    except ValueError:

        try:
            event_datetime = datetime.strptime(
                f"{event_date} {event_time}",
                "%Y-%m-%d %H:%M"
            )

        except ValueError:
            return False

    return event_datetime > datetime.now()


# ----------------------------
# Create event - Admin only
# ----------------------------

@app.post(
    "/events",
    status_code=status.HTTP_201_CREATED
)
def create_event(
    data: dict = Body(...),
    admin=Depends(require_admin)
):

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    event_date = data.get("event_date", "")
    event_time = data.get("event_time", "")
    location = data.get("location", "").strip()
    capacity = data.get("capacity")
    event_status = data.get("status", "Draft")


    if not title:
        raise HTTPException(
            status_code=400,
            detail="Event title is required"
        )

    if not description:
        raise HTTPException(
            status_code=400,
            detail="Event description is required"
        )

    if not event_date:
        raise HTTPException(
            status_code=400,
            detail="Event date is required"
        )

    if not event_time:
        raise HTTPException(
            status_code=400,
            detail="Event time is required"
        )

    if not location:
        raise HTTPException(
            status_code=400,
            detail="Event location is required"
        )


    # Capacity validation

    if not isinstance(capacity, int) or capacity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Capacity must be a positive whole number"
        )


    allowed_statuses = [
        "Draft",
        "Published",
        "Completed",
        "Cancelled"
    ]


    if event_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid event status"
        )


    # New events should not directly be completed/cancelled

    if event_status in ["Completed", "Cancelled"]:
        raise HTTPException(
            status_code=400,
            detail="A new event cannot be created as Completed or Cancelled"
        )


    # Published event must be in future

    if event_status == "Published":

        if not event_is_future(
            event_date,
            event_time
        ):

            raise HTTPException(
                status_code=400,
                detail="A published event must have a future date and time"
            )


    event_data = {
        "title": title,
        "description": description,
        "event_date": event_date,
        "event_time": event_time,
        "location": location,
        "capacity": capacity,
        "status": event_status
    }


    try:

        response = (
            supabase
            .table("events")
            .insert(event_data)
            .execute()
        )


        return {
            "message": "Event created successfully",
            "event": response.data[0]
        }


    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ----------------------------
# Upcoming published events
# ----------------------------

@app.get("/events")
def get_upcoming_events():

    today = datetime.now().date().isoformat()


    try:

        response = (
            supabase
            .table("events")
            .select("*")
            .eq("status", "Published")
            .gte("event_date", today)
            .order("event_date")
            .order("event_time")
            .execute()
        )


        events = []


        for event in response.data:

            # Removes events from earlier today

            if not event_is_future(
                event["event_date"],
                event["event_time"]
            ):
                continue


            # Count active registrations

            registration_response = (
                supabase
                .table("registrations")
                .select("id")
                .eq("event_id", event["id"])
                .eq("status", "Registered")
                .execute()
            )


            registered_count = len(
                registration_response.data
            )


            available_capacity = (
                event["capacity"]
                -
                registered_count
            )


            event["registered_count"] = (
                registered_count
            )

            event["available_capacity"] = max(
                available_capacity,
                0
            )


            events.append(event)


        return events


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ----------------------------
# Get one upcoming event
# ----------------------------

@app.get("/events/{event_id}")
def get_event(event_id: int):

    try:

        response = (
            supabase
            .table("events")
            .select("*")
            .eq("id", event_id)
            .execute()
        )


        if not response.data:

            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )


        event = response.data[0]


        # Attendee/public event details
        # should only show published future events

        if event["status"] != "Published":

            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )


        if not event_is_future(
            event["event_date"],
            event["event_time"]
        ):

            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )


        registration_response = (
            supabase
            .table("registrations")
            .select("id")
            .eq("event_id", event_id)
            .eq("status", "Registered")
            .execute()
        )


        registered_count = len(
            registration_response.data
        )


        event["registered_count"] = (
            registered_count
        )

        event["available_capacity"] = max(
            event["capacity"] - registered_count,
            0
        )


        return event


    except HTTPException:
        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ----------------------------
# Admin - View all events
# ----------------------------

@app.get("/admin/events")
def get_all_events(
    admin=Depends(require_admin)
):

    try:

        response = (
            supabase
            .table("events")
            .select("*")
            .order("event_date")
            .execute()
        )


        result = []


        for event in response.data:

            registration_response = (
                supabase
                .table("registrations")
                .select("id")
                .eq("event_id", event["id"])
                .eq("status", "Registered")
                .execute()
            )


            registered_count = len(
                registration_response.data
            )


            event["registered_count"] = (
                registered_count
            )

            event["available_capacity"] = max(
                event["capacity"] - registered_count,
                0
            )


            result.append(event)


        return result


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ----------------------------
# Edit event - Admin only
# ----------------------------

@app.put("/events/{event_id}")
def update_event(
    event_id: int,
    data: dict = Body(...),
    admin=Depends(require_admin)
):

    # Find event first

    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )


    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )


    current_event = event_response.data[0]


    # Completed and Cancelled are terminal

    if current_event["status"] in [
        "Completed",
        "Cancelled"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Completed or cancelled events cannot be edited"
        )


    update_data = {}


    # Title

    if "title" in data:

        title = str(
            data["title"]
        ).strip()

        if not title:

            raise HTTPException(
                status_code=400,
                detail="Event title cannot be empty"
            )

        update_data["title"] = title


    # Description

    if "description" in data:

        description = str(
            data["description"]
        ).strip()

        if not description:

            raise HTTPException(
                status_code=400,
                detail="Event description cannot be empty"
            )

        update_data["description"] = description


    # Date

    if "event_date" in data:

        if not data["event_date"]:

            raise HTTPException(
                status_code=400,
                detail="Event date cannot be empty"
            )

        update_data["event_date"] = (
            data["event_date"]
        )


    # Time

    if "event_time" in data:

        if not data["event_time"]:

            raise HTTPException(
                status_code=400,
                detail="Event time cannot be empty"
            )

        update_data["event_time"] = (
            data["event_time"]
        )


    # Location

    if "location" in data:

        location = str(
            data["location"]
        ).strip()

        if not location:

            raise HTTPException(
                status_code=400,
                detail="Location cannot be empty"
            )

        update_data["location"] = location


    # Capacity

    if "capacity" in data:

        new_capacity = data["capacity"]


        if (
            not isinstance(new_capacity, int)
            or
            new_capacity <= 0
        ):

            raise HTTPException(
                status_code=400,
                detail="Capacity must be a positive whole number"
            )


        active_response = (
            supabase
            .table("registrations")
            .select("id")
            .eq("event_id", event_id)
            .eq("status", "Registered")
            .execute()
        )


        active_count = len(
            active_response.data
        )


        if new_capacity < active_count:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Capacity cannot be lower than "
                    "the number of active registrations"
                )
            )


        update_data["capacity"] = (
            new_capacity
        )


    if not update_data:

        raise HTTPException(
            status_code=400,
            detail="No valid event fields provided"
        )


    # If event is already published,
    # resulting schedule must still be future

    final_date = update_data.get(
        "event_date",
        current_event["event_date"]
    )

    final_time = update_data.get(
        "event_time",
        current_event["event_time"]
    )


    if current_event["status"] == "Published":

        if not event_is_future(
            final_date,
            final_time
        ):

            raise HTTPException(
                status_code=400,
                detail="A published event must remain in the future"
            )


    try:

        response = (
            supabase
            .table("events")
            .update(update_data)
            .eq("id", event_id)
            .execute()
        )


        return {
            "message": "Event updated successfully",
            "event": response.data[0]
        }


    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ----------------------------
# Change event status
# Admin only
# ----------------------------

@app.patch("/events/{event_id}/status")
def change_event_status(
    event_id: int,
    data: dict = Body(...),
    admin=Depends(require_admin)
):

    new_status = data.get("status")


    allowed_statuses = [
        "Draft",
        "Published",
        "Completed",
        "Cancelled"
    ]


    if new_status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid event status"
        )


    event_response = (
        supabase
        .table("events")
        .select("*")
        .eq("id", event_id)
        .execute()
    )


    if not event_response.data:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )


    event = event_response.data[0]
    current_status = event["status"]


    # Terminal states

    if current_status in [
        "Completed",
        "Cancelled"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Completed or cancelled events "
                "cannot change status"
            )
        )


    # Allowed transitions

    valid_transitions = {
        "Draft": [
            "Published",
            "Cancelled"
        ],
        "Published": [
            "Completed",
            "Cancelled"
        ]
    }


    if new_status == current_status:

        raise HTTPException(
            status_code=400,
            detail=f"Event is already {current_status}"
        )


    if new_status not in valid_transitions.get(
        current_status,
        []
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change event from "
                f"{current_status} to {new_status}"
            )
        )


    # Publishing requires future schedule

    if new_status == "Published":

        if not event_is_future(
            event["event_date"],
            event["event_time"]
        ):

            raise HTTPException(
                status_code=400,
                detail="Past events cannot be published"
            )


    # Completing should only happen
    # after event date/time has passed

    if new_status == "Completed":

        if event_is_future(
            event["event_date"],
            event["event_time"]
        ):

            raise HTTPException(
                status_code=400,
                detail="A future event cannot be marked Completed"
            )


    try:

        response = (
            supabase
            .table("events")
            .update({
                "status": new_status
            })
            .eq("id", event_id)
            .execute()
        )


        return {
            "message":
                f"Event status changed to {new_status}",

            "event":
                response.data[0]
        }


    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

# ----------------------------
# Register for event
# Attendee only
# ----------------------------

@app.post(
    "/events/{event_id}/register",
    status_code=status.HTTP_201_CREATED
)
def register_for_event_endpoint(
    event_id: int,
    current_user=Depends(get_current_user)
):

    # Only Attendees register for events
    if current_user["role"] != "Attendee":

        raise HTTPException(
            status_code=403,
            detail="Only attendees can register for events"
        )

    try:

        response = supabase.rpc(
            "register_for_event",
            {
                "p_user_id": current_user["id"],
                "p_event_id": event_id
            }
        ).execute()

        return response.data


    except Exception as e:

        error_message = str(e)

        if "Event not found" in error_message:
            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )

        if "already registered" in error_message:
            raise HTTPException(
                status_code=409,
                detail="You are already registered for this event"
            )

        if "Event is full" in error_message:
            raise HTTPException(
                status_code=409,
                detail="Event is full"
            )

        if (
            "not open for registration" in error_message
            or
            "Registration is closed" in error_message
        ):
            raise HTTPException(
                status_code=400,
                detail="Event is not open for registration"
            )

        raise HTTPException(
            status_code=400,
            detail=error_message
        )

# ----------------------------
# My registrations
# Attendee only
# ----------------------------

@app.get("/my-registrations")
def get_my_registrations(
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "Attendee":
        raise HTTPException(
            status_code=403,
            detail="Only attendees can view their registrations"
        )

    try:

        response = (
            supabase
            .table("registrations")
            .select(
                "id, status, created_at, updated_at, "
                "events(id, title, description, event_date, "
                "event_time, location, status)"
            )
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )

        return response.data

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ----------------------------
# Cancel registration
# Attendee only
# ----------------------------

@app.patch(
    "/registrations/{registration_id}/cancel"
)
def cancel_registration(
    registration_id: int,
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "Attendee":
        raise HTTPException(
            status_code=403,
            detail="Only attendees can cancel registrations"
        )

    try:

        # Find registration.
        # user_id condition also protects ownership.
        registration_response = (
            supabase
            .table("registrations")
            .select(
                "id, user_id, event_id, status, "
                "events(id, event_date, event_time, status)"
            )
            .eq("id", registration_id)
            .eq("user_id", current_user["id"])
            .execute()
        )

        if not registration_response.data:
            raise HTTPException(
                status_code=404,
                detail="Registration not found"
            )

        registration = registration_response.data[0]

        if registration["status"] == "Cancelled":
            raise HTTPException(
                status_code=400,
                detail="Registration is already cancelled"
            )

        event = registration["events"]

        # Registration can only be cancelled
        # while the event is still upcoming.
        if not event_is_future(
            event["event_date"],
            event["event_time"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Past event registrations cannot be cancelled"
            )

        if event["status"] in [
            "Completed",
            "Cancelled"
        ]:
            raise HTTPException(
                status_code=400,
                detail="This registration can no longer be cancelled"
            )

        response = (
            supabase
            .table("registrations")
            .update({
                "status": "Cancelled"
            })
            .eq("id", registration_id)
            .eq("user_id", current_user["id"])
            .execute()
        )

        return {
            "message": "Registration cancelled successfully",
            "registration": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ----------------------------
# Admin - View attendees for event
# ----------------------------

@app.get("/admin/events/{event_id}/attendees")
def get_event_attendees(
    event_id: int,
    search: str = "",
    admin=Depends(require_admin)
):

    try:

        # Check event exists
        event_response = (
            supabase
            .table("events")
            .select("id, title, event_date, event_time, location, capacity, status")
            .eq("id", event_id)
            .execute()
        )

        if not event_response.data:
            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )

        event = event_response.data[0]

        # Get registrations with user details
        registration_response = (
            supabase
            .table("registrations")
            .select(
                "id, status, created_at, "
                "users(id, name, email)"
            )
            .eq("event_id", event_id)
            .eq("status", "Registered")
            .order("created_at")
            .execute()
        )

        attendees = []

        for registration in registration_response.data:

            user = registration["users"]

            attendee = {
                "registration_id": registration["id"],
                "user_id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "registered_at": registration["created_at"]
            }

            attendees.append(attendee)


        # Optional search by attendee name
        if search.strip():

            search_text = search.lower().strip()

            attendees = [
        attendee
        for attendee in attendees
        if (
            search_text in attendee["name"].lower()
            or
            search_text in attendee["email"].lower()
        )
    ]


        return {
            "event": event,
            "total_attendees": len(attendees),
            "attendees": attendees
        }


    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ----------------------------
# Admin dashboard
# ----------------------------

@app.get("/admin/dashboard")
def get_admin_dashboard(
    admin=Depends(require_admin)
):
    try:

        # Get all events
        events_response = (
            supabase
            .table("events")
            .select("*")
            .execute()
        )

        events = events_response.data


        # Get all registrations
        registrations_response = (
            supabase
            .table("registrations")
            .select("id, event_id, status")
            .execute()
        )

        registrations = registrations_response.data


        total_events = len(events)

        draft_events = 0
        published_events = 0
        completed_events = 0
        cancelled_events = 0

        active_registrations = 0
        cancelled_registrations = 0

        total_capacity = 0
        total_available_capacity = 0


        # Count event statuses
        for event in events:

            if event["status"] == "Draft":
                draft_events += 1

            elif event["status"] == "Published":
                published_events += 1

            elif event["status"] == "Completed":
                completed_events += 1

            elif event["status"] == "Cancelled":
                cancelled_events += 1


        # Published event IDs only
        published_event_ids = []

        for event in events:

            if event["status"] == "Published":

                published_event_ids.append(
                    event["id"]
                )

                total_capacity += event["capacity"]


        # Count registrations
        for registration in registrations:

            if registration["status"] == "Cancelled":
                cancelled_registrations += 1

            elif (
                registration["status"] == "Registered"
                and
                registration["event_id"]
                in published_event_ids
            ):
                active_registrations += 1


        # Calculate available capacity
        # Only for Published events
        for event in events:

            if event["status"] != "Published":
                continue


            event_registration_count = 0


            for registration in registrations:

                if (
                    registration["event_id"]
                    == event["id"]
                    and
                    registration["status"]
                    == "Registered"
                ):
                    event_registration_count += 1


            available = (
                event["capacity"]
                -
                event_registration_count
            )


            total_available_capacity += max(
                available,
                0
            )


        return {
            "events": {
                "total": total_events,
                "draft": draft_events,
                "published": published_events,
                "completed": completed_events,
                "cancelled": cancelled_events
            },

            "registrations": {
                "active": active_registrations,
                "cancelled": cancelled_registrations,
                "total": len(registrations)
            },

            "capacity": {
                "total": total_capacity,
                "available": total_available_capacity
            }
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
# ----------------------------
# Admin - Event report
# ----------------------------

@app.get("/admin/reports/events/{event_id}")
def get_event_report(
    event_id: int,
    admin=Depends(require_admin)
):

    try:

        # Get event
        event_response = (
            supabase
            .table("events")
            .select(
                "id, title, description, event_date, "
                "event_time, location, capacity, status"
            )
            .eq("id", event_id)
            .execute()
        )

        if not event_response.data:
            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )

        event = event_response.data[0]


        # Get all registrations for this event
        registrations_response = (
            supabase
            .table("registrations")
            .select(
                "id, status, created_at, "
                "users(id, name, email)"
            )
            .eq("event_id", event_id)
            .order("created_at")
            .execute()
        )

        registrations = registrations_response.data

        active_attendees = []
        active_count = 0
        cancelled_count = 0


        for registration in registrations:

            if registration["status"] == "Registered":

                active_count += 1

                user = registration["users"]

                active_attendees.append({
                    "registration_id": registration["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "registered_at": registration["created_at"]
                })

            elif registration["status"] == "Cancelled":

                cancelled_count += 1


        available_capacity = (
            event["capacity"] - active_count
        )


        return {

            "event": event,

            "summary": {
                "capacity": event["capacity"],
                "active_registrations": active_count,
                "cancelled_registrations": cancelled_count,
                "available_capacity": max(
                    available_capacity,
                    0
                )
            },

            "attendees": active_attendees
        }


    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )