# API Contracts: Real-Time Librarian Room Management Dashboard

**Feature**: Real-Time Librarian Room Management Dashboard
**Date**: 2026-08-01

All endpoints are **read-only** (FR-013), authenticated, and restricted to the `librarian` role via `verifyToken` + `authorizeRole('librarian')` (and optionally `admin`), consistent with existing `/dashboard/librarian` routes.

All endpoints return the project's unified JSON envelope:

```json
{ "success": true, "data": { }, "message": "..." }
```

or on failure:

```json
{ "success": false, "data": null, "message": "..." }
```

Errors use appropriate HTTP status codes (400, 401, 403, 404, 500) following existing controller conventions. Every endpoint enforces **branch isolation (FR-001)**: results are filtered to the logged-in librarian's `branch_id` (from `req.user.branch_id`, resolved from `users.branch_id`).

---

## 1. Dashboard Overview

**`GET /dashboard/librarian/rooms/overview`** — authenticated (librarian)

Returns the branch's summary counts for today.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "branchId": 1,
    "totalBookingsToday": 24,
    "occupied": 18,
    "totalRooms": 20,
    "pendingCheckins": 6
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `branchId` | int | Librarian's branch |
| `totalBookingsToday` | int | Reservations with `start_date = today` in this branch |
| `occupied` | int | Distinct rooms with an active reservation whose slot window includes the current time today |
| `totalRooms` | int | Total rooms in the branch |
| `pendingCheckins` | int | Reservations today with status `pending` |

---

## 2. Active Reservations List

**`GET /dashboard/librarian/rooms/reservations?search=&status=&from=&to=&page=1&limit=10`** — authenticated (librarian)

Returns a paginated, filterable list of active reservations for the branch.

**Query params**

| Param | Type | Notes |
|-------|------|-------|
| `search` | string, optional | Substring match on user name, user ID, or room number |
| `status` | string, optional | `reserved`, `pending`, `used`, or `completed` (completed = `used` + return record); empty = all |
| `from` / `to` | date `YYYY-MM-DD`, optional | Inclusive date range; default `from = today` (upcoming) |
| `page` | int, default 1 | 1-based page number |
| `limit` | int, default 10 | Page size |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "reserveId": "8c2a1b3f-...",
        "roomName": "Room A1",
        "location": "3rd Floor, North Wing",
        "capacity": 6,
        "user": { "userId": "f1c8...", "username": "minhng", "avatar": null },
        "date": "2026-08-01",
        "startTime": "09:30:00",
        "endTime": "11:30:00",
        "durationMinutes": 120,
        "status": "in_progress",
        "branchId": 1
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
  }
}
```

**Status mapping**: `reserved` → `confirmed`, `pending` → `pending_checkin`, `used` (no return) → `in_progress`, `used` (return exists) → `completed`.

---

## 3. Calendar Schedule

**`GET /dashboard/librarian/rooms/schedule?from=&to=&view=week`** — authenticated (librarian)

Returns the rooms and reservation events for a branch within a date range, for rendering the week/day calendar grid.

**Query params**

| Param | Type | Notes |
|-------|------|-------|
| `from` / `to` | date `YYYY-MM-DD` | Inclusive range; for `view=day` both equal the selected day |
| `view` | `week` (default) or `day` | Determines granularity; `week` spans Monday..Sunday |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "branchId": 1,
    "rooms": [
      { "roomId": 2, "roomName": "Room A1", "capacity": 6, "location": "3rd Floor, North Wing" }
    ],
    "events": [
      {
        "reserveId": "8c2a1b3f-...",
        "roomId": 2,
        "date": "2026-08-01",
        "startTime": "09:30:00",
        "endTime": "11:30:00",
        "status": "used",
        "title": "minhng"
      }
    ]
  }
}
```

`title` is the reserving user's username (the schema has no reservation-title field; the mockup's event labels are a layout reference).

---

## 4. Reservation Detail (Read-only)

**`GET /dashboard/librarian/rooms/reservations/:reserveId`** — authenticated (librarian)

Returns full details for a single reservation. Read-only; no mutation possible.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "reserveId": "8c2a1b3f-...",
    "status": "used",
    "date": "2026-08-01",
    "startTime": "09:30:00",
    "endTime": "11:30:00",
    "checkinTime": "2026-08-01T09:31:00.000Z",
    "checkoutTime": null,
    "room": { "roomId": 2, "roomName": "Room A1", "location": "3rd Floor, North Wing", "capacity": 6, "imgUrl": "https://..." },
    "user": { "userId": "f1c8...", "username": "minhng", "email": "m@example.com", "phoneNumber": "..." },
    "branchId": 1
  }
}
```

**Errors**

| Code | Status | When |
|------|--------|------|
| `NOT_FOUND` | 404 | Reservation not found, not in the librarian's branch, or no matching `reserve_room` row |

---

## 5. Live Push Event (Socket)

**`room-dashboard:changed`** — server → `branch:{branchId}` room (Socket.IO)

Emitted whenever a room reservation event occurs in a branch, so open dashboards refresh within 5 seconds (FR-014).

**Payload**

```json
{
  "changeType": "created | cancelled | pin_generated | pin_cleaned | pin_expired | checked_in | checked_out | checkout_defaulted",
  "branchId": 1
}
```

**Emission points** (all existing mutation paths, extended):

| changeType | Emitted by |
|------------|-----------|
| `created` | `room.services.createReservation` |
| `cancelled` | `room.services.cancelReservation` |
| `pin_generated` | `room.services.generateRoomPin` |
| `pin_cleaned` | `room.services.cleanupRoomPin` |
| `pin_expired` | `pinScheduler` expired-PIN cleanup |
| `checked_in` | `dashboard.librarian.services.confirmRoomCheckin` |
| `checked_out` | `room.services.confirmCheckout` |
| `checkout_defaulted` | `pinScheduler` checkout backfill |

**Client subscription pattern** (same as existing `useAnnouncementBell`):

```ts
const socket = useSocket(token);
useEffect(() => {
  if (!socket) return;
  const refresh = () => { /* re-fetch overview, list, calendar */ };
  socket.on('room-dashboard:changed', refresh);
  return () => { socket.off('room-dashboard:changed', refresh); };
}, [socket]);
```

Sockets without a `branch_id` never join a branch room and receive nothing. Existing `announcement:changed` / `study-group:changed` broadcasts are unchanged.
