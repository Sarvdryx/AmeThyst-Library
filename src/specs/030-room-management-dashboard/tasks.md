---

description: "Task list for the Real-Time Librarian Room Management Dashboard feature"
---

# Tasks: Real-Time Librarian Room Management Dashboard

**Input**: Design documents from `/specs/030-room-management-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/room-management-dashboard-api.md, quickstart.md

**Tests**: Backend service tests are included (per repo convention `server/tests/services/*.spec.mjs` and the test file listed in plan.md project structure). Write each test FIRST, verify it FAILS, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. The feature is read-only; all backend work is new GET endpoints + a socket emit helper, all frontend work composes existing Atomic Design components.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `server/src/{routes,controllers,services,models,config,utils}/` (`.mjs`, layered `routes -> middlewares -> controllers -> services -> models`)
- **Frontend**: `client/app/` (App Router), components under `client/app/components/{atoms,molecules,organisms}/`
- **Tests**: `server/tests/services/*.spec.mjs`
- **Locales**: `client/app/locales/en.json`, `client/app/locales/vi.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the existing full-stack environment the feature builds on

- [X] T001 Verify backend (`server/`, port 5000) and frontend (`client/`, port 3000) dev servers run and the existing room + librarian dashboard endpoints respond (`GET /api/rooms/details`, `POST /dashboard/librarian/verify-room-pin`)
- [X] T002 [P] Confirm socket infrastructure is importable (`server/src/config/socket.mjs` exports `initSocket`/`getIO`; `client/app/utils/useSocket.ts` + `client/app/config/socket.ts` exist) and `client/app/utils/apiClient.ts` `apiFetch` works

**Checkpoint**: Environment verified — existing conventions confirmed before any new code

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure every user story needs — branch-scoped socket room, route registration, and the dashboard page shell

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Extend `server/src/config/socket.mjs` to join `socket.join('branch:' + branchId)` on connect when the JWT payload has a non-null `branch_id`, and export `emitRoomDashboardChanged(branchId, changeType)` using `io.to('branch:' + branchId).emit('room-dashboard:changed', { changeType, branchId })` — without altering existing `announcement:changed` / `study-group:changed` broadcasts
- [X] T004 [P] Register the four new read-only routes in `server/src/routes/dashboard.librarian.routes.mjs` (all `verifyToken` + `authorizeRole('librarian')`): `GET /rooms/overview`, `GET /rooms/reservations`, `GET /rooms/schedule`, `GET /rooms/reservations/:reserveId`
- [X] T005 [P] Create `client/app/dashboard/librarian/rooms/page.tsx` rendering the `RoomManagementDashboard` organism
- [X] T006 [P] Create `client/app/components/organisms/RoomManagementDashboard.tsx` shell with list/calendar view toggle, explicit loading/error/success states, and `apiFetch`-based data fetching wired to `NEXT_PUBLIC_API_URL`
- [X] T007 [P] Wire the placeholder `sidebar_rooms` item in `client/app/components/organisms/LibrarianDashboardSidebar.tsx` from `href: '#'` to `/dashboard/librarian/rooms`

**Checkpoint**: Foundation ready — the rooms page renders with the toggle shell; user story implementation can begin

---

## Phase 3: User Story 1 - Librarian Monitors Room Usage at a Glance (Priority: P1) 🎯 MVP

**Goal**: The librarian sees branch-isolated today's total bookings, currently occupied (X/Y with capacity bar), and pending check-ins cards.

**Independent Test**: Log in as the branch-1 librarian, open `/dashboard/librarian/rooms`, and verify the three KPI cards match real branch-1 data; repeat as the branch-2 librarian and confirm no cross-branch numbers appear.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [P] [US1] Service test for `getRoomsOverview` (counts match, branch filter, zero-data branch returns zeros) in `server/tests/services/dashboard.librarian.rooms.spec.mjs`

### Implementation for User Story 1

- [X] T009 [P] [US1] Add branch-scoped overview query `getRoomsOverviewStats(branchId)` to `server/src/models/room.models.mjs` (totalBookingsToday, occupied distinct rooms within current slot window, totalRooms, pendingCheckins per data-model.md, using `VIETNAM_NOW_SQL` conventions)
- [X] T010 [US1] Implement `getRoomsOverview(branchId)` service with `WRONG_BRANCH`-style guard in `server/src/services/dashboard.librarian.services.mjs`
- [X] T011 [US1] Implement `getRoomsOverview` controller in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T012 [US1] Wire `GET /rooms/overview` to the controller in `server/src/routes/dashboard.librarian.routes.mjs`
- [X] T013 [US1] Render the three KPI cards (Total Bookings Today, Currently Occupied X/Y, Pending Check-ins) in `client/app/components/organisms/RoomManagementDashboard.tsx` reusing `KPIStatCard`, `KPIProgressBar`, `TrendIndicator`, `Skeleton` from `client/app/components/{molecules,atoms}/`

**Checkpoint**: User Story 1 fully functional — MVP dashboard with live branch-isolated stats

---

## Phase 4: User Story 2 - Librarian Browses and Filters Active Reservations (Priority: P1)

**Goal**: The librarian sees a paginated, searchable, filterable active reservations list (room, user, date, time slot, duration, status chip).

**Independent Test**: On the dashboard, search by user name / user ID / room number, apply a status filter and a date range, and confirm the list + pagination narrow correctly per the API `pagination` object.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US2] Service test for `getActiveReservations` (search across username/user_id::text/room_name, status filter incl. `completed`, date-range filter, pagination totals) in `server/tests/services/dashboard.librarian.rooms.spec.mjs`

### Implementation for User Story 2

- [X] T015 [P] [US2] Add branch-scoped active reservations query `findActiveReservations(branchId, { search, status, from, to, page, limit })` to `server/src/models/room.models.mjs` (shared WHERE for count + page, `ILIKE` search, status→display mapping per data-model.md, ORDER BY start_date ASC, start_time ASC)
- [X] T016 [US2] Implement `getActiveReservations(branchId, filters)` service in `server/src/services/dashboard.librarian.services.mjs`
- [X] T017 [US2] Implement `getActiveReservations` controller (parse query params, default `from = today`) in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T018 [US2] Wire `GET /rooms/reservations` to the controller in `server/src/routes/dashboard.librarian.routes.mjs`
- [X] T019 [P] [US2] Build the reservations table UI (rows with room name/location/capacity, user avatar+name, date, time slot, duration, status chips, detail icon) in `client/app/components/organisms/RoomManagementDashboard.tsx` reusing `SearchBar`, `FilterDropdown`, `StatusBadge`, `BookTablePagination`, and the `BookPickupTab`/`BookTableRow` row pattern
- [X] T020 [US2] Connect search (debounced), status filter, date-range inputs, and pagination to `GET /rooms/reservations` via `apiFetch` in `client/app/components/organisms/RoomManagementDashboard.tsx`

**Checkpoint**: User Stories 1 AND 2 work independently — operational list view complete

---

## Phase 5: User Story 3 - Librarian Views the Daily/Weekly Room Schedule (Priority: P2)

**Goal**: The librarian sees the calendar view with rooms as rows, days as columns, and reservations as time-positioned blocks, toggleable between week and day.

**Independent Test**: Switch to calendar view, select a week and a day, and verify reservation blocks land on the correct room row, day, and time per `GET /rooms/schedule`.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T021 [P] [US3] Service test for `getRoomSchedule` (rooms list, events in range, week vs day range handling) in `server/tests/services/dashboard.librarian.rooms.spec.mjs`

### Implementation for User Story 3

- [X] T022 [P] [US3] Add branch-scoped schedule query `findRoomSchedule(branchId, from, to)` returning `rooms` + `events` to `server/src/models/room.models.mjs` (rooms = branch `study_room`; events = `reserve_room` join `room_avail`/`study_room`/`users` in range, with `title` = username)
- [X] T023 [US3] Implement `getRoomSchedule(branchId, from, to, view)` service (compute week Monday..Sunday for `view=week`) in `server/src/services/dashboard.librarian.services.mjs`
- [X] T024 [US3] Implement `getRoomSchedule` controller in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T025 [US3] Wire `GET /rooms/schedule` to the controller in `server/src/routes/dashboard.librarian.routes.mjs`
- [X] T026 [P] [US3] Render the calendar grid (rooms as rows, days as columns, colored time blocks with username + time range) in `client/app/components/organisms/RoomManagementDashboard.tsx` reusing `CalendarView` / `DashboardCalendar` from `client/app/components/molecules/`
- [X] T027 [US3] Add the week/day toggle wired to `view=week|day` in `client/app/components/organisms/RoomManagementDashboard.tsx`

**Checkpoint**: User Stories 1–3 functional — monitoring + list + schedule all independently testable

---

## Phase 6: User Story 4 - Librarian Views Reservation Details (Priority: P2)

**Goal**: The librarian opens a reservation's full read-only details (room, user, times, status, check-in/out). No edit/cancel/delete anywhere (FR-013).

**Independent Test**: Click a row's detail icon and verify full reservation info displays; confirm no mutation controls exist on the page.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T028 [P] [US4] Service test for `getReservationDetail` (full shape, 404 not found, cross-branch 403) in `server/tests/services/dashboard.librarian.rooms.spec.mjs`

### Implementation for User Story 4

- [X] T029 [P] [US4] Add branch-scoped detail query `findReservationDetail(reserveId, branchId)` to `server/src/models/room.models.mjs` (join `room_avail`/`study_room`/`users`/`return_room`; expose `checkinTime`, `checkoutTime`)
- [X] T030 [US4] Implement `getReservationDetail(reserveId, branchId)` service with branch guard in `server/src/services/dashboard.librarian.services.mjs`
- [X] T031 [US4] Implement `getReservationDetail` controller in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T032 [US4] Wire `GET /rooms/reservations/:reserveId` to the controller in `server/src/routes/dashboard.librarian.routes.mjs`
- [X] T033 [P] [US4] Build the read-only detail panel/modal in `client/app/components/organisms/RoomManagementDashboard.tsx` reusing the `BorrowerInfoPanel`/modal pattern — no mutation controls

**Checkpoint**: All four user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Live push updates (FR-014/SC-004), theming/localization (Core Principle IX), and end-to-end validation

- [X] T034 [P] Emit `room-dashboard:changed` (branch-scoped) from all user-side mutation points in `server/src/services/room.services.mjs`: `createReservation` (created), `cancelReservation` (cancelled), `generateRoomPin` (pin_generated), `cleanupRoomPin` (pin_cleaned), `confirmCheckout` (checked_out)
- [X] T035 [P] Emit `room-dashboard:changed` from `confirmRoomCheckin` (checked_in) in `server/src/services/dashboard.librarian.services.mjs`
- [X] T036 [P] Emit `room-dashboard:changed` from `pinScheduler` cleanup (pin_expired) and checkout backfill (checkout_defaulted) in `server/src/utils/pinScheduler.mjs`
- [X] T037 [P] Subscribe to `room-dashboard:changed` via `useSocket` in `client/app/components/organisms/RoomManagementDashboard.tsx` and refresh overview/list/calendar within 5 seconds (guard against redundant fetches)
- [X] T038 [P] Add all new UI strings to both `client/app/locales/en.json` and `client/app/locales/vi.json` and invoke them via the i18n `t()` hook in `client/app/components/organisms/RoomManagementDashboard.tsx`
- [X] T039 [P] Ensure all new UI in `client/app/components/organisms/RoomManagementDashboard.tsx` uses design tokens / dark-mode utilities (no hardcoded hex), per Core Principle IX
- [ ] T040 Run `quickstart.md` validation end-to-end (all 5 scenarios incl. cross-branch isolation and live update timing) and run the backend test suite (`npm test` in `server/`) + lint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–6)**: All depend on Foundational (socket room helper, route registration, page shell)
  - US1 (Phase 3) and US2 (Phase 4) can proceed in parallel (different routes/UI sections)
  - US3 (Phase 5) and US4 (Phase 6) can also start in parallel once foundational shell exists
- **Polish (Phase 7)**: Depends on all user stories being complete (emits hook existing mutation points; live-refresh subscribes all views)

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — MVP
- **User Story 2 (P1)**: No dependencies on other stories — shares the shell + model/service files but touches distinct functions (no conflict)
- **User Story 3 (P2)**: No dependencies on other stories — new schedule query + calendar UI section
- **User Story 4 (P2)**: No dependencies on other stories — new detail query + detail panel

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services; services before controllers/routes
- Backend endpoint before frontend UI section that consumes it

### Parallel Opportunities

- All Phase 2 tasks marked [P] can run in parallel (socket helper, routes, page, sidebar are separate files)
- US1 and US2 backend tasks touch the same `room.models.mjs` / `dashboard.librarian.services.mjs` files — sequence within each file but different functions; UI tasks are separate sections of `RoomManagementDashboard.tsx`
- All test tasks marked [P] can run in parallel
- Polish tasks marked [P] can run in parallel (distinct files)

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tasks together:
Task: "Extend config/socket.mjs with branch room + emitRoomDashboardChanged"
Task: "Register four new routes in dashboard.librarian.routes.mjs"
Task: "Create dashboard/librarian/rooms/page.tsx"
Task: "Create RoomManagementDashboard.tsx shell"
Task: "Wire sidebar_rooms href in LibrarianDashboardSidebar.tsx"
```

## Parallel Example: User Story 1 (backend + frontend + tests)

```bash
# Launch together:
Task: "Service test for getRoomsOverview in server/tests/services/dashboard.librarian.rooms.spec.mjs"
Task: "Add getRoomsOverviewStats query to server/src/models/room.models.mjs"
# Then (depends on model + test):
Task: "Implement getRoomsOverview service"
Task: "Implement getRoomsOverview controller"
Task: "Render three KPI cards in RoomManagementDashboard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test the overview cards independently (branch-isolated stats)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → dashboard shell renders
2. Add User Story 1 → overview cards (MVP)
3. Add User Story 2 → searchable/filterable/paginated reservations list
4. Add User Story 3 → week/day calendar
5. Add User Story 4 → read-only reservation detail
6. Add Polish → live push updates + localization + theming
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (overview cards)
   - Developer B: User Story 2 (reservations list)
   - Developer C: User Story 3 (calendar) — after backend list endpoints settle
3. Story 4 detail panel after list UI stabilizes
4. Polish (socket emits + live refresh) once all views exist

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- The dashboard is read-only (FR-013) — no mutation endpoints or in-UI edit/cancel/delete anywhere
- Branch isolation (FR-001) applies to every backend query via `users.branch_id` / JWT `branch_id`
