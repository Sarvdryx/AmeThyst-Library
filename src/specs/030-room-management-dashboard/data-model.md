# Data Model: Real-Time Librarian Room Management Dashboard

**Feature**: Real-Time Librarian Room Management Dashboard
**Date**: 2026-08-01

> **Schema change status: NONE.** This feature is **read-only** and operates entirely on existing columns in `study_room`, `room_avail`, `reserve_room`, `return_room`, `users`, and `branches`. No `database/init_db/postgres/*.sql` files are modified.

## Entities

### 1. `study_room` — Room / schedule row source

| Column | Type | Purpose in this feature |
|--------|------|-------------------------|
| `room_id` | int (PK) | Room identity; row key in the calendar view |
| `branch_id` | int (FK → `branches.branch_id`) | **Branch isolation key (FR-001)** — every query filters `study_room.branch_id = $branchId` |
| `room_name` | varchar(30) | Displayed room name in list rows and calendar row headers; searchable field |
| `capacity` | int | Displayed in row subtitle (e.g., "Floor 3 • Capacity 4") and calendar header |
| `description` | text | Used as the room's location/wing text in the calendar row header |
| `img_url` | text | Room image (used by detail panels if shown) |

**Invariants**: A room belongs to exactly one branch. Total room count per branch (`COUNT(study_room.*)`) is the denominator of the "currently occupied X/Y" card.

### 2. `room_avail` — Time slot (read-only reference)

| Column | Type | Purpose in this feature |
|--------|------|-------------------------|
| `avail_id` | int (PK) | Joined from `reserve_room.avail_id` |
| `room_id` | int (FK → `study_room.room_id`) | Links a slot to a room |
| `start_time` | time | Slot start — used for the "duration" and time block positioning |
| `end_time` | time | Slot end — used for duration, calendar block range, and the occupancy time-window check |

### 3. `reserve_room` — Reservation / occupancy source

| Column | Type | Purpose in this feature |
|--------|------|-------------------------|
| `reserve_id` | uuid (PK) | Reservation identity; detail endpoint key |
| `user_id` | uuid (FK → `users.user_id`) | Owning user; drives the "USER" column and username search |
| `avail_id` | int (FK → `room_avail.avail_id`) | Resolves slot times and room |
| `start_date` | date | Reservation day; drives today's bookings, occupancy window, date-range filters, and calendar placement |
| `created_at` | timestamp | Creation time (informational) |
| `checkin_time` | timestamp (nullable) | Populated on librarian check-in; shown in detail |
| `status` | varchar(20) CHECK (`reserved`,`pending`,`used`) | Drives the status chips and the pending check-ins count |
| `pin` / `expired_at` | varchar / timestamp | Not displayed by this dashboard; presence of a PIN is what makes a reservation `pending` |

**Status → display mapping**

| Schema state | Display label | Contribution |
|--------------|---------------|--------------|
| `status = 'reserved'` | Confirmed | Today's bookings; occupied window |
| `status = 'pending'` | Pending Check-in | Today's bookings; pending check-ins count; occupied window |
| `status = 'used'`, no `return_room` | In Progress | Today's bookings; occupied window |
| `status = 'used'`, `return_room` exists | Completed | Today's bookings (if today); NOT occupied |

**Branch resolution for queries**: branch is obtained by joining `reserve_room.avail_id → room_avail.room_id → study_room.branch_id`. The service receives the librarian's `branch_id` and guards every result set (mirrors the existing `WRONG_BRANCH` 403 guard used by `verifyRoomPin`/`confirmRoomCheckin`).

### 4. `return_room` — Completion marker

| Column | Type | Purpose |
|--------|------|---------|
| `return_id` | uuid (PK) | Check-out identity |
| `reserve_id` | uuid (FK → `reserve_room.reserve_id`, ON DELETE CASCADE) | Join key to determine "Completed" status |
| `checkout_time` | timestamp | Informational in the detail view |

### 5. `users` — Reservation holder / search source

| Column | Type | Purpose |
|--------|------|---------|
| `user_id` | uuid (PK) | Searchable "ID" field; detail identity |
| `username` | varchar(100) | Displayed name + avatar initials; searchable field |
| `branch_id` | int (FK → `branches`, nullable) | The librarian's own branch comes from here via JWT; also the user's home branch |
| `email`, `phone_number`, `avatar` | — | Shown in the read-only detail panel |

### 6. `branches` — Branch context

| Column | Type | Purpose |
|--------|------|---------|
| `branch_id` | int (PK) | Scoping key everywhere |
| `name`, `address` | — | Displayed in detail panel context |

## Relationships

```text
branches ──< study_room ──< room_avail <── reserve_room >── users
                │                              │
                └──────── branch_id ────────────┘
                                        │
                                        └──< return_room (reserve_id, 0..1)
```

- `study_room.branch_id` → `branches.branch_id` (branch isolation driver)
- `room_avail.room_id` → `study_room.room_id`
- `reserve_room.avail_id` → `room_avail.avail_id`
- `reserve_room.user_id` → `users.user_id`
- `return_room.reserve_id` → `reserve_room.reserve_id` (0..1 — existence marks completion)

## Query Semantics

### Overview stats (branch-scoped, all `WHERE sr.branch_id = $branchId`)

| Stat | Definition |
|------|-----------|
| Today's total bookings | `COUNT(rr.reserve_id)` where `rr.start_date = CURRENT_DATE` |
| Currently occupied | `COUNT(DISTINCT sr.room_id)` where `rr.start_date = CURRENT_DATE`, `rr.status IN ('reserved','pending','used')`, and `CURRENT_TIME BETWEEN ra.start_time AND ra.end_time` (Vietnam-local); rendered as `occupied / COUNT(sr.room_id)` |
| Pending check-ins | `COUNT(rr.reserve_id)` where `rr.start_date = CURRENT_DATE` and `rr.status = 'pending'` |

### Active reservations list

- Scope: `rr.start_date >= CURRENT_DATE` by default; narrowed by optional `from`/`to`.
- Filters: `search` (`u.username ILIKE` OR `u.user_id::text ILIKE` OR `sr.room_name ILIKE`), `status` (one of `reserved`/`pending`/`used`, or "completed" resolved to `status='used' AND return_room EXISTS`).
- Order: `rr.start_date ASC, ra.start_time ASC`.
- Pagination: `LIMIT $limit OFFSET ($page-1)*$limit`; same WHERE for count and page queries.
- Each row: `reserveId`, `roomName`, `floor`/location (from `sr.description`), `capacity`, `user {username, avatar}`, `date`, `startTime`, `endTime`, `duration` (`end_time - start_time`), `status` (mapped), `branchId`.

### Calendar schedule

- `rooms`: `sr.room_id, sr.room_name, sr.capacity, sr.description` for the branch.
- `events`: `rr.reserve_id, ra.room_id, rr.start_date, ra.start_time, ra.end_time, rr.status, u.username` for `rr.start_date BETWEEN $from AND $to`, ordered by date/time.
- `view=week`: `from` = Monday of selected week, `to` = Sunday; `view=day`: `from = to` = selected day.

## Time semantics

| Concept | Source | Notes |
|---------|--------|-------|
| Today / slot window | `CURRENT_DATE`, `CURRENT_TIME AT TIME ZONE 'Asia/Ho_Chi_Minh'` | Reuse `VIETNAM_NOW_SQL` convention from `room.models.mjs` |
| Recorded instants | `checkin_time`, `checkout_time` | Displayed via `UTC_ISO_SQL` formatting where shown |

## State transitions

This feature does **not** mutate any state (FR-013). It observes the existing transitions:

```text
reserved ──(create PIN)──▶ pending ──(librarian verifies)──▶ used ──(checkout)──▶ Completed
     ▲                        │
     └────(PIN expired/cleaned)─┘
```
