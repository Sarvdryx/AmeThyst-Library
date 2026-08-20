# Data Model: Freely Room Reservation

**Branch**: `025-freely-room-reservation` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

---

## Entity Overview

Four existing PostgreSQL tables participate in this feature. No schema modifications are permitted.

---

## Entity: `study_room`

Represents a physical study room in the library.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `room_id` | integer | PK, NOT NULL | Unique room identifier |
| `branch_id` | integer | NOT NULL | Branch location (NVC/LT) |
| `room_name` | varchar | NOT NULL | Display name (e.g. "Conference Room C1") |
| `capacity` | integer | NOT NULL | Max occupancy (0 = unreservable) |
| `tv_num` | integer | DEFAULT 0 | Number of TV screens |
| `board_num` | integer | DEFAULT 0 | Number of whiteboards |
| `socket_num` | integer | DEFAULT 0 | Number of power sockets |
| `projector_num` | integer | DEFAULT 0 | Number of projectors |
| `img_url` | varchar | NULLABLE | Cloudinary image URL for 3D visualization |
| `description` | text | NULLABLE | Room description text |

**Relationships**:
- `study_room.room_id` → `room_avail.room_id` (one-to-many: a room has many availability slots)

**Validation Rules**:
- Rooms with `capacity = 0` are unreservable (lounges, lockers) and must not show booking options

---

## Entity: `room_avail`

Defines predefined time windows during which a room can be booked.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `avail_id` | integer | PK, NOT NULL | Unique availability slot identifier |
| `room_id` | integer | FK → study_room.room_id, NOT NULL | Which room this slot belongs to |
| `start_time` | time | NOT NULL | Slot start time (e.g. 07:30:00) |
| `end_time` | time | NOT NULL | Slot end time (e.g. 10:30:00) |

**Relationships**:
- `room_avail.room_id` → `study_room.room_id` (many-to-one)
- `room_avail.avail_id` → `reserve_room.avail_id` (one-to-many: a slot can have many reservations across dates)

**Validation Rules**:
- `end_time` MUST be after `start_time`

---

## Entity: `reserve_room`

Tracks user bookings of room availability slots on specific dates.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `reserve_id` | uuid | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique reservation identifier |
| `user_id` | integer | FK → users.user_id, NOT NULL | User who made the reservation |
| `avail_id` | integer | FK → room_avail.avail_id, NOT NULL | Which time slot is booked |
| `start_date` | date | NOT NULL | The date the reservation is for |
| `checkin_time` | timestamp | NULLABLE | When user checked in (future feature) |
| `pin` | varchar | NULLABLE | PIN for check-in (future feature) |
| `expired_at` | timestamp | NULLABLE | When reservation expires (future feature) |
| `status` | varchar | NOT NULL, DEFAULT 'reserved' | Current status: `reserved`, `pending`, or `used` |

**Relationships**:
- `reserve_room.user_id` → `users.user_id` (many-to-one)
- `reserve_room.avail_id` → `room_avail.avail_id` (many-to-one)
- `reserve_room.reserve_id` → `return_room.reserve_id` (one-to-one, optional — out of scope)

**Validation Rules**:
- `status` MUST be one of: `reserved`, `pending`, `used`
- For this feature, new reservations MUST be created with `status = 'reserved'`
- `checkin_time`, `pin`, `expired_at` MUST be left NULL on creation (set by future tasks)
- The combination `(avail_id, start_date)` should prevent duplicate bookings (application-level check)

**State Transitions**:
```
reserved → pending → used  (future check-in/out flow)
reserved → cancelled        (future cancel flow)
```

---

## Entity: `return_room`

Check-out record linked to a reservation (out of scope for this feature).

| Field | Type | Constraints | Description |
|---|---|---|---|
| `return_id` | integer | PK, NOT NULL | Unique check-out record |
| `reserve_id` | uuid | FK → reserve_room.reserve_id, NOT NULL | Which reservation is checked out |
| `checkout_time` | timestamp | NOT NULL | When user checked out |

---

## Data Flow Diagram

```
User selects room + date
        │
        ▼
FR-005: Query reserve_room WHERE start_date = selected_date
        │ Get list of booked avail_ids
        ▼
FR-005: Query room_avail WHERE room_id = target AND avail_id NOT IN (booked ids)
        │ Return remaining start_time, end_time
        ▼
User picks a slot and confirms
        │
        ▼
FR-007: INSERT INTO reserve_room (user_id, avail_id, start_date, status)
        VALUES ($1, $2, $3, 'reserved')
        │
        ▼
Dashboard view: SELECT rr.start_date, ra.start_time, ra.end_time, 
                 rr.status, sr.img_url
                 FROM reserve_room rr
                 JOIN room_avail ra ON rr.avail_id = ra.avail_id
                 JOIN study_room sr ON ra.room_id = sr.room_id
                 WHERE rr.user_id = current_user
                 ORDER BY rr.start_date DESC
```

## Image Resolution Path

As specified in FR-011:
```
reserve_room.avail_id → room_avail.room_id → study_room.img_url
```
This traversal is required for the dashboard reservation cards to display each room's image.
