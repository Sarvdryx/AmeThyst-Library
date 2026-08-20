# Data Model: User Dashboard

## Calendar Event

Represents a scheduled activity displayed on the dashboard calendar and agenda panel.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | SERIAL (PK) | Auto | Unique identifier |
| `user_id` | INTEGER (FK → users) | Yes | Owner of the event |
| `title` | VARCHAR(255) | Yes | Event display name |
| `event_date` | DATE | Yes | Date the event occurs |
| `event_time` | TIME | No | Time of the event (optional for all-day) |
| `location` | VARCHAR(255) | No | Room or place |
| `event_type` | VARCHAR(50) | Yes | Enum: `book_return`, `room_reservation`, `study_group`, `pin_expiry`, `personal_task` |
| `description` | TEXT | No | Optional details |
| `created_at` | TIMESTAMP | Auto | Creation timestamp |

### Relationships

- **User** 1 → N **Calendar Event**: A user can have many calendar events
- No other entity relationships for v1

### Validation Rules

- `event_date` must not be in the past when creating a new event (except for personal tasks)
- `event_type` must be one of the allowed enum values
- `title` must be at least 1 character, at most 255 characters

## Agenda (Derived View)

Agenda items are not stored separately — they are a filtered subset of `calendar_events`:
- **Today**: `WHERE event_date = CURRENT_DATE`
- **Tomorrow**: `WHERE event_date = CURRENT_DATE + 1`

## State Transitions

N/A — events are simple CRUD with no complex workflow states in v1.
