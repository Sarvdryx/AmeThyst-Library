# API Contract: User Dashboard

## Base URL

- Development: `http://localhost:5000`
- Client env: `NEXT_PUBLIC_API_URL`

## Authentication Header

Protected routes require:

```http
Authorization: Bearer <jwt_token>
```

---

## Dashboard Routes (`/dashboard`)

### GET `/dashboard/events`

Fetch calendar events for a given month.

**Query Parameters**

| Param | Required | Type | Description |
|-------|----------|------|-------------|
| `month` | yes | number (1-12) | Month to fetch events for |
| `year` | yes | number (e.g. 2026) | Year to fetch events for |

**Responses**

| Status | Body |
|--------|------|
| 200 | `{ "events": [ { "id": 1, "title": "Book return", "date": "2026-06-15", "time": "10:00", "location": "Main Desk", "type": "book_return", "description": null } ] }` |
| 401 | `{ "error": "Unauthorized" }` |

**Event Type Enums**: `book_return`, `room_reservation`, `study_group`, `pin_expiry`, `personal_task`

---

### GET `/dashboard/agenda`

Fetch today's and tomorrow's events for the upcoming agenda panel.

**Responses**

| Status | Body |
|--------|------|
| 200 | `{ "today": [ { "id": 1, "title": "Philosophy Study Group", "time": "10:00", "location": "Quiet Wing, Room 304", "type": "study_group" } ], "tomorrow": [ { "id": 2, "title": "Thesis Writing Block", "time": "09:00", "location": "Private Booth #12", "type": "room_reservation" } ] }` |
| 401 | `{ "error": "Unauthorized" }` |

---

### POST `/dashboard/events`

Add a personal task to the calendar.

**Request Body**

```json
{
  "title": "Study session",
  "date": "2026-06-25",
  "time": "14:00",
  "location": "Library Floor 2",
  "type": "personal_task",
  "description": "Review chapter 5"
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| title | yes | string | 1-255 characters |
| date | yes | string (YYYY-MM-DD) | Must not be far in past |
| time | no | string (HH:MM) | Optional |
| location | no | string | Optional |
| type | yes | string | Must be valid event type |
| description | no | string | Optional |

**Responses**

| Status | Body |
|--------|------|
| 201 | `{ "message": "Event created", "event": { "id": 3, ... } }` |
| 400 | `{ "error": "Validation error details" }` |
| 401 | `{ "error": "Unauthorized" }` |
