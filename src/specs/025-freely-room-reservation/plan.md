# Implementation Plan: Freely Room Reservation

**Branch**: `025-freely-room-reservation` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-freely-room-reservation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the "Freely Room Reservation" feature for individual users. The flow starts at the User sidebar "Room Reservations" nav item, leads to the interactive floor map where users select a room, choose "Freely" mode, pick a date, view available time slots, and confirm a reservation. The dashboard displays reservation history with room images, statuses, and placeholder action buttons. Backend requires two new endpoints (GET available slots, POST create reservation) with authentication middleware.

## Technical Context

**Language/Version**: TypeScript (Next.js 16 + React 19.2) for frontend; JavaScript/Node.js (Express 5.2, ES modules `.mjs`) for backend

**Primary Dependencies**: Frontend — `next`, `react`, `tailwindcss`, `socket.io-client`; Backend — `express`, `pg` (PostgreSQL), `passport`, `jsonwebtoken`, `bcryptjs`, `cors`

**Storage**: PostgreSQL 15 via `pg` driver — existing tables `study_room`, `room_avail`, `reserve_room`, `return_room` must be used without schema changes

**Testing**: Vitest v4 + Supertest for server-side tests (controllers, services, integration); no client-side test framework configured

**Target Platform**: Web browser (desktop-first responsive) + Node.js server

**Project Type**: Web application (separate frontend SPA via Next.js + backend REST API via Express)

**Performance Goals**: Standard web app — page loads under 2s, API responses under 500ms, concurrent user capacity for small library system (~100 simultaneous users)

**Constraints**: 
- Existing database schema MUST NOT be altered
- Reservation status values: `reserved`, `pending`, `used` (from schema)
- "Tạo mã PIN" and "Hủy" buttons are UI-only placeholders with no backend wiring
- "Study Group" mode is out of scope; its UI option may appear but must be disabled

**Scale/Scope**: Small library management system; estimated 100-500 active users, ~23 rooms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution file found at `.specify/memory/constitution.md`. No constitutional gates to evaluate. Proceeding directly to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/025-freely-room-reservation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
client/                           # Next.js frontend
├── app/
│   ├── components/
│   │   ├── atoms/
│   │   ├── molecules/
│   │   └── organisms/
│   │       ├── FloorMap.tsx          # Extend: mode selection when room clicked
│   │       ├── RoomDetailPanel.tsx   # Extend: date picker + time slot UI + confirm flow
│   │       └── DashboardSidebar.tsx  # Already has "Room Reservations" nav (href needs wiring)
│   ├── dashboard/
│   │   └── user/
│   │       └── page.tsx              # Extend: room reservations section or new sub-page
│   ├── map/
│   │   └── page.tsx                  # Already implemented
│   ├── locales/
│   │   ├── en.json                   # Add room reservation i18n keys
│   │   └── vi.json                   # Add room reservation i18n keys
│   └── utils/
│       └── apiClient.ts              # Reuse for API calls

server/                           # Express.js backend
├── src/
│   ├── routes/
│   │   └── room.routes.mjs           # Extend: add POST / create reservation
│   ├── controllers/
│   │   └── room.controllers.mjs      # Extend: add createReservation controller
│   ├── services/
│   │   └── room.services.mjs         # Extend: add createReservation logic
│   └── models/
│       └── room.models.mjs           # Extend: add createReservation query
└── tests/
    └── ...                           # Add room reservation spec files
```

**Structure Decision**: Web application with separate `client/` (Next.js) and `server/` (Express) directories, matching the existing project layout. Backend follows existing MVC pattern (routes → controllers → services → models). Frontend follows Atomic Design under `client/app/components/`.

## Backend Architecture

The server follows an MVC-style layered architecture: **Routes → Controllers → Services → Models**. Each layer has a single responsibility and communicates only with the layer directly below it.

### Layer Overview

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Routes (room.routes.mjs)                          │
│  • Map HTTP method + path to controller function   │
│  • Apply middlewares (verifyToken, validation)       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Controllers (room.controllers.mjs)                │
│  • Parse & validate req.query / req.body / req.user │
│  • Call service layer                               │
│  • Return standardized JSON response                │
│  • Catch errors and map to HTTP status codes         │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Services (room.services.mjs)                      │
│  • Business logic (e.g. "check slot availability")  │
│  • Orchestrate multiple model calls if needed       │
│  • Throw descriptive errors with status codes       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Models (room.models.mjs)                          │
│  • SQL queries via pg pool                          │
│  • Return raw row data, camelCase aliased           │
│  • No business logic — pure data access              │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
              PostgreSQL 15
```

### Routes (`server/src/routes/room.routes.mjs`)

| Method | Path | Middleware | Controller | Status |
|---|---|---|---|---|
| `GET` | `/api/rooms/details` | — | `getRoomDetailsController` | Existing |
| `GET` | `/api/rooms/availability` | — | `getRoomAvailabilityController` | Existing |
| `POST` | `/api/rooms/reserve` | `verifyToken` | `createReservationController` | **New** |

The new route is registered by adding one line to the existing router:
```js
router.post('/reserve', verifyToken, createReservationController);
```

`verifyToken` extracts `req.user` from the JWT in the `Authorization: Bearer <token>` header. The `user_id` is available as `req.user.userId`.

### Controllers (`server/src/controllers/room.controllers.mjs`)

All controllers follow the existing pattern:

```js
export const controllerName = async (req, res) => {
  try {
    // 1. Extract and validate input from req.query / req.body / req.user
    // 2. Call service function
    // 3. Respond with { success: true, data: ... }
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Default message'
    });
  }
};
```

**New controller — `createReservationController`**:
- Reads `availId` and `startDate` from `req.body`
- Reads `userId` from `req.user.userId` (set by `verifyToken`)
- Validates both fields are present (400 if missing)
- Calls `roomService.createReservation(userId, availId, startDate)`
- Returns 201 on success with `{ success: true, data: reservation }`
- Returns 409 if slot already booked (service throws status 409)
- Returns 500 for unexpected errors

### Services (`server/src/services/room.services.mjs`)

**Existing**: `getRoomDetails`, `getRoomAvailability`

**New — `createReservation(userId, availId, startDate)`**:
```js
export const createReservation = async (userId, availId, startDate) => {
  // 1. Validate date format (YYYY-MM-DD)
  // 2. Check that the slot is not already reserved for this date
  //    (query reserve_room WHERE avail_id = $1 AND start_date = $2
  //     AND status IN ('reserved', 'pending'))
  // 3. If found → throw error with status 409
  // 4. Otherwise → call roomModel.createReservation(userId, availId, startDate)
  // 5. Return the created reservation record
};
```

### Models (`server/src/models/room.models.mjs`)

**Existing**: `findRoomByNameAndBranch`, `findRoomById`, `findRoomAvailability`

**New — `createReservation(userId, availId, startDate)`**:
```js
export const createReservation = async (userId, availId, startDate) => {
  const query = `
    INSERT INTO reserve_room (user_id, avail_id, start_date, status)
    VALUES ($1, $2, $3, 'reserved')
    RETURNING 
      reserve_id AS "reserveId",
      avail_id AS "availId",
      start_date AS "startDate",
      status
  `;
  const result = await pool.query(query, [userId, availId, startDate]);
  return result.rows[0];
};
```

**New — `findReservationBySlotAndDate(availId, startDate)`** (for conflict check):
```js
export const findReservationBySlotAndDate = async (availId, startDate) => {
  const query = `
    SELECT reserve_id AS "reserveId"
    FROM reserve_room
    WHERE avail_id = $1 AND start_date = $2
      AND status IN ('reserved', 'pending')
    LIMIT 1
  `;
  const result = await pool.query(query, [availId, startDate]);
  return result.rows[0] || null;
};
```

### Middlewares (`server/src/middlewares/auth.middleware.mjs`)

The existing `verifyToken` middleware is reused as-is:
- Reads `Authorization` header, extracts Bearer token
- Verifies JWT with `process.env.JWT_SECRET`
- Sets `req.user = decoded` on success
- Returns 401 `{ error: 'No token provided' }` or `{ error: 'Invalid token' }` on failure

No new middleware is needed for this feature.

### Response Format

All endpoints use a consistent JSON envelope:

**Success**:
```json
{ "success": true, "data": { ... } }
```

**Error**:
```json
{ "success": false, "error": "Human-readable message" }
```

### Data Flow: Creating a Reservation

```
1. User clicks "Confirm" on frontend
2. Frontend calls POST /api/rooms/reserve with { availId, startDate }
   + Authorization: Bearer <token>
3. verifyToken middleware validates JWT → req.user = { userId, ... }
4. Route calls createReservationController
5. Controller extracts availId, startDate from req.body, userId from req.user
6. Controller calls roomService.createReservation(userId, availId, startDate)
7. Service calls roomModel.findReservationBySlotAndDate(availId, startDate)
8. Model runs SELECT → returns existing reservation or null
9. Service checks: if found → throw 409 "This time slot is no longer available."
10. Service calls roomModel.createReservation(userId, availId, startDate)
11. Model runs INSERT INTO reserve_room ... RETURNING ...
12. Service returns the new reservation record
13. Controller responds 201 { success: true, data: reservation }
```

## Complexity Tracking

No constitution violations to justify.
