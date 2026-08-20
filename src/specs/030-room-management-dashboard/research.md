# Research: Real-Time Librarian Room Management Dashboard

**Feature**: Real-Time Librarian Room Management Dashboard
**Date**: 2026-08-01

Phase 0 output for `specs/030-room-management-dashboard/plan.md`. Consolidates findings from codebase exploration of `server/src/` and `client/app/`.

---

## 1. Statistics Definitions

**Decision**: Compute the three overview counts with branch-scoped SQL over `reserve_room` joined to `room_avail`/`study_room`:

- **Today's total bookings** = `COUNT(reserve_room.*)` where `study_room.branch_id = $branch` and `reserve_room.start_date = CURRENT_DATE`.
- **Currently occupied** = `COUNT(DISTINCT room_id)` where `study_room.branch_id = $branch`, `reserve_room.start_date = CURRENT_DATE`, `reserve_room.status IN ('reserved','pending','used')`, and the current Vietnam time falls within `room_avail.start_time`–`room_avail.end_time`; rendered as `occupied/total` alongside the branch's total room count (`COUNT(study_room.*)` for the branch).
- **Pending check-ins** = `COUNT(reserve_room.*)` where `study_room.branch_id = $branch`, `reserve_room.start_date = CURRENT_DATE`, and `reserve_room.status = 'pending'`.

**Rationale**: The status lifecycle (`reserved` → `pending` → `used`, plus PIN cleanup resetting `pending`→`reserved`) already models real occupancy. "Occupied" is defined as an active reservation whose slot window includes the current moment; "pending check-ins" maps directly to the `pending` status (a PIN was generated but not yet verified). The design mockup's three cards (Total Bookings Today, Currently Occupied, Pending Check-ins) map 1:1 to these counts.

**Alternatives considered**:
- Counting only `status = 'used'` for occupancy — rejected: a room with a `reserved`/`pending` reservation in its active slot window is also physically occupied/claimed.
- Treating `return_room` presence as "completed" — rejected for the summary: today's bookings and occupancy care about active reservations; completion is relevant to the detail/history views, not the headline counts.

---

## 2. Active Reservations: Scope & Status Mapping

**Decision**: The active reservations list defaults to today + upcoming (all reservations with `start_date >= CURRENT_DATE`), ordered by `start_date ASC, start_time ASC`. It is server-side paginated. The date-range filter allows narrowing to any inclusive window.

Status chips map schema state to display labels:

| Schema state | Display label |
|--------------|---------------|
| `status = 'used'` AND a `return_room` row exists | Completed |
| `status = 'used'` AND no `return_room` row | In Progress |
| `status = 'pending'` (PIN awaiting verification) | Pending Check-in |
| `status = 'reserved'` | Confirmed |

**Rationale**: Cancelled reservations are hard-deleted by the existing `cancelReservation` service, so they never appear in the list — the "Cancelled" chip in the mockup is a layout reference only. Completion is determined by the presence of a `return_room` row joined via `reserve_id`. This mapping matches the existing `findUserReservations` JOIN pattern (`reserve_room` → `room_avail` → `study_room` → `branches` → `return_room`).

**Alternatives considered**:
- Showing past reservations in the default list — rejected: the design is titled "Active Reservations"; history is a separate concern covered by the existing `/api/rooms/history` endpoint.
- Deriving "In Progress" purely from time-window overlap — rejected: `status='used'` + no return record is the cleaner, existing signal that a check-in happened.

---

## 3. Search & Filters

**Decision**: A single parameterized query combines optional `search`, `status`, `from`, `to`, and pagination (`page`, `limit`). Search matches any of:
- `users.username ILIKE %term%`,
- `users.user_id::text ILIKE %term%` (matches the user ID as text),
- `study_room.room_name ILIKE %term%`.

Count + page queries share the same WHERE clause for accurate totals. Default page size 10, mirroring `BookPickupTab`'s client pattern but implemented server-side so filtering/searching is data-accurate at scale.

**Rationale**: The design's single search input says "Search by user name, ID, or room number...", which is exactly the three columns above. `ILIKE` with a trimmed term and `%term%` wrapping gives substring matching; user ID is matched as text since UUIDs are searchable strings for librarians.

**Alternatives considered**:
- Full-text search / trigram indexes — rejected: data volumes per branch are small (dozens of reservations); no new indexes or schema changes are permitted.
- Client-side filtering — rejected: server-side pagination combined with filtering is required for correctness when the dataset grows.

---

## 4. Calendar Schedule Query

**Decision**: Build the week/day payload from a branch-scoped query over `study_room` × (`room_avail` JOIN `reserve_room`) for the requested date range:

- `rooms`: all `study_room` rows for the branch (`room_id`, `room_name`, `capacity`, `description` for location).
- `events`: reservations within `from`..`to` inclusive, each exposing `roomId`, `date` (`start_date`), `startTime`, `endTime`, `status`, and the reserving user's `username` (used as the block label since the schema has no event-title field).

Time-zone handling reuses the established `VIETNAM_NOW_SQL` / `UTC_ISO_SQL` conventions from `room.models.mjs` — dates are Vietnam-local, instants are stored as timestamps.

**Rationale**: The mockup's calendar (rooms as rows, days as columns, colored blocks with a title + time range) maps to "reservations as time-positioned blocks". Since the schema has no reservation title, the block label derives from the reserving user's username. The week/day toggle only changes the date range (`view=week` → Monday..Sunday of the selected week; `view=day` → a single day); the data shape is identical.

**Alternatives considered**:
- Client-side derivation of the grid from the flat reservations list — rejected: returning the pre-joined rooms + events keeps the frontend simple and reuses existing `CalendarView`/`DashboardCalendar` molecules as-is.

---

## 5. Branch-Scoped Live Push

**Decision**: Extend `config/socket.mjs` to:
1. On connect, read `branch_id` from the JWT payload (already present via `signToken(userId, email, role, branchId)`) and `socket.join('branch:' + branchId)` when it is non-null.
2. Export `emitRoomDashboardChanged(branchId, changeType)` which does `io.to('branch:' + branchId).emit('room-dashboard:changed', { changeType, branchId })`.
3. Emit from every mutation point:
   - `room.services.mjs`: `createReservation` (created), `cancelReservation` (cancelled), `generateRoomPin` (pin_generated), `cleanupRoomPin` (pin_cleaned), `confirmCheckout` (checked_out).
   - `dashboard.librarian.services.mjs`: `confirmRoomCheckin` (checked_in).
   - `pinScheduler.mjs` / scheduler cleanup: after `cleanupExpiredPins` (pin_expired) and `backfillDefaultedCheckouts` (checkout_defaulted) — these mutate rows outside request handlers.
   - Study-group reservation flows that insert/delete `reserve_room` rows (via the branch resolved from the reservation).

Existing `announcement:changed` and `study-group:changed` broadcasts are left untouched.

**Rationale**: The dashboard is read-only (FR-013), so freshness must come from push, not from the dashboard calling mutation endpoints. Branch-scoped rooms (`branch:{branchId}`) deliver the required 5-second freshness (SC-004) without leaking other branches' data (FR-001). The JWT already carries `branch_id`, so no auth changes are needed. The `io.emit` → `io.to('branch:'+id).emit` change is additive; existing sockets without a branch simply never join a branch room and receive nothing.

**Alternatives considered**:
- Global broadcast `io.emit('room-dashboard:changed')` — rejected: leaks branch activity and forces every librarian to re-fetch on any branch's change.
- Polling on an interval — rejected: the spec explicitly chose live push (clarification Q2 = B) with a 5-second freshness target.
- Piggybacking on `announcement:changed` — rejected: different domain, would over-fetch and couple unrelated features.

---

## 6. Frontend Wiring

**Decision**:
- New route `client/app/dashboard/librarian/rooms/page.tsx` renders a new organism `client/app/components/organisms/RoomManagementDashboard.tsx`.
- The organism composes existing atoms/molecules: `KPIStatCard` (3 cards), `SearchBar` + `FilterDropdown` (status) + date-range inputs, a reservations table reusing the `BookPickupTab`/`BookTableRow` pattern with `BookTablePagination`, a read-only detail panel (reuse `BorrowerInfoPanel`/modal pattern), and `CalendarView` with the week/day toggle.
- The dashboard subscribes via `useSocket(token)` and `socket.on('room-dashboard:changed', refresh)` — exactly the pattern in `hooks/useAnnouncementBell.ts` — with a debounced/guarded refresh so all three sections (stats, list, calendar) re-fetch on the event.
- `LibrarianDashboardSidebar.tsx`: change `sidebar_rooms.href` from `'#'` to `/dashboard/librarian/rooms`.
- List/calendar toggling switches which organism section is visible; both share the same fetched `rooms`/`events` data where possible.
- All new strings added to `client/app/locales/en.json` and `client/app/locales/vi.json`; styling uses design tokens / dark-mode utilities.

**Rationale**: Every building block already exists and is verified in the codebase (confirmed by exploration): `useSocket` hook, `apiFetch`, `KPIStatCard`, `SearchBar`, `FilterDropdown`, `BookTablePagination`, `CalendarView`, `LibrarianDashboardSidebar`. The `sidebar_rooms` placeholder (`href:'#'`) is the intended entry point.

**Alternatives considered**:
- Building new custom molecules from scratch — rejected by Core Principle I (Atomic Design); reuse is mandated and verified feasible.
