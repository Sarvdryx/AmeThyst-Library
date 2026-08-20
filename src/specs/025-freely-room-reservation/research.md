# Phase 0 Research: Freely Room Reservation

**Branch**: `025-freely-room-reservation` | **Date**: 2026-07-18

## Research Summary

No NEEDS CLARIFICATION items remained in the Technical Context — all unknowns were resolved through codebase exploration. This document consolidates decisions, rationale, and alternatives considered.

---

## Technology Decisions

### Frontend: Next.js 16 + React 19.2 + Tailwind CSS v4

- **Decision**: Extend existing Next.js app with App Router
- **Rationale**: Frontend framework already established; project uses Atomic Design component structure, Tailwind CSS v4 for styling, and locale-based i18n
- **Alternatives considered**: Creating a separate SPA (rejected — would break navigation flow with existing dashboard/map)

### Backend: Express 5.2 + PostgreSQL + JWT Auth

- **Decision**: Add endpoints to existing Express server using existing MVC pattern
- **Rationale**: Backend framework and database driver (`pg`) already established; room routes/controllers/services/models already exist for GET endpoints; auth middleware (`verifyToken`) already exists
- **Alternatives considered**: New microservice (rejected — overkill for 2 endpoints in small library system)

### Testing: Vitest + Supertest

- **Decision**: Write server-side tests following existing patterns in `server/tests/`
- **Rationale**: Vitest v4 + Supertest already configured; existing spec files (`register.controller.spec.mjs`, `register.api.spec.mjs`) provide patterns to follow
- **Client testing**: No test framework configured for client; out of scope for this feature

---

## Data Decisions

### Database Schema

- **Decision**: Use existing tables `study_room`, `room_avail`, `reserve_room`, `return_room` without schema changes
- **Rationale**: Spec explicitly forbids schema modification; existing queries already handle availability lookups
- **Key insight**: The existing `findRoomAvailability` model already does a LEFT JOIN between `room_avail` and `reserve_room` — the reservation creation endpoint is the missing piece

### Reservation Status Values

From database schema (`05_init_rest.sql`):
- `reserved` — initial status after successful booking
- `pending` — intermediate/check-in state
- `used` — completed/checked-out
- The spec requires setting `status = 'reserved'` on creation

---

## UI/UX Decisions

### Room Detail Panel Enhancement

- **Decision**: Extend existing `RoomDetailPanel.tsx` to add mode selection (Freely vs Study Group) before date picking, and inline the confirmation flow instead of linking to `/library/reserve`
- **Rationale**: Current panel already fetches room details and availability; the "Book Room" button links to a `/library/reserve` page that doesn't exist. Embedding the flow avoids creating a dead route
- **Alternatives considered**: Creating `/library/reserve` page (rejected — redirect approach adds unnecessary navigation)

### Dashboard Reservations View

- **Decision**: Create a new dashboard sub-page at `/dashboard/user/reservations` following the `room_reservation_design` template
- **Rationale**: Dashboard sidebar already has "Room Reservations" nav item (currently href `#`); a dedicated sub-page keeps the dashboard organized; design template exists at `.specify/template/room_reservation_design.txt`
- **Layout**: "Upcoming" section (horizontal card grid) + "Past Bookings" section (table layout) matching the design reference

### Date Picker

- **Decision**: Use native HTML `<input type="date">` (already implemented in `RoomDetailPanel`)
- **Rationale**: Already implemented and working; provides consistent date UX across browsers

---

## Integration Decisions

### API Gateway / Client Communication

- **Decision**: Use existing `apiClient.ts` utility (wraps `fetch` with JWT token injection) for authenticated requests
- **Rationale**: Already used throughout the app; handles token attachment and error responses consistently

### Room Image Resolution

- **Decision**: Resolve image through `reserve_room.avail_id → room_avail.room_id → study_room.img_url` as specified
- **Rationale**: Spec explicitly requires this traversal path; backend can resolve via JOIN query

---

## Database Schema Review

Confirmed existing table structures from `database/init_db/postgres/03_datafacility.sql` and `05_init_rest.sql`:

| Table | Key Columns |
|---|---|
| `study_room` | `room_id` (PK), `branch_id`, `room_name`, `capacity`, `tv_num`, `board_num`, `socket_num`, `projector_num`, `img_url`, `description` |
| `room_avail` | `avail_id` (PK), `room_id` (FK → study_room), `start_time`, `end_time` |
| `reserve_room` | `reserve_id` (PK, uuid), `user_id` (FK → users), `avail_id` (FK → room_avail), `start_date`, `checkin_time`, `pin`, `expired_at`, `status` |
| `return_room` | `return_id` (PK), `reserve_id` (FK → reserve_room), `checkout_time` |

All constraints (PKs, FKs, NOT NULL, defaults) remain unchanged per spec constraints.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Concurrent booking of same slot | Use database-level unique constraint or application-level check-and-insert with transaction; return conflict error to second user |
| Room image URL missing/null | Provide fallback/placeholder image in the dashboard card |
| Existing `room_reservation` event types in calendar | Calendar atoms (`CalendarEventBadge`, `CalendarEventDot`) already support `room_reservation` type — reuse for dashboard events |
