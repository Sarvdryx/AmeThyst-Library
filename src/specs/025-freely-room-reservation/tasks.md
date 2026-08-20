---

description: "Task list for Freely Room Reservation feature implementation"

---

# Tasks: Freely Room Reservation

**Input**: Design documents from `/specs/025-freely-room-reservation/`

**Prerequisites**: plan.md (required), spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Client**: `client/app/` (Next.js App Router)
- **Server**: `server/src/` (Express.js MVC)
- Tests: `server/tests/` (Vitest + Supertest)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared resources needed across all user stories

- [x] T001 Add room reservation i18n keys to `client/app/locales/en.json` and `client/app/locales/vi.json` (keys: `sidebar_room_reservations`, `room.freely_mode`, `room.study_group_mode`, `room.reserve_confirm`, `room.reserve_success`, `room.slot_unavailable`, `room.no_slots`, `room.create_pin`, `room.cancel`, `room.upcoming`, `room.past_bookings`, `room.no_reservations`, `room.new_reservation`, `room.room_name`, `room.date`, `room.time_slot`, `room.duration`, `room.status`)

**Checkpoint**: Shared i18n resources ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Wire sidebar "Room Reservations" href in `client/app/components/organisms/DashboardSidebar.tsx` — change `href` from `#` to `/dashboard/user/reservations`
- [x] T003 [P] Create dashboard user reservations page shell at `client/app/dashboard/user/reservations/page.tsx` with "Room Reservations" title, empty "Upcoming" section, and empty "Past Bookings" section

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Book a Room via Map (Priority: P1) 🎯 MVP

**Goal**: User can start from the dashboard sidebar, navigate to the map, select a room, choose "Freely" mode, pick a date and time slot, and confirm a reservation.

**Independent Test**: Log in → click "Room Reservations" in sidebar → map loads → click a room → select "Freely" → pick date → see available slots → select one → confirm → receive success message.

### Backend: Reservation Creation API

- [x] T004 [P] [US1] Create `findReservationBySlotAndDate` query model in `server/src/models/room.models.mjs` — SELECT from `reserve_room` WHERE `avail_id` and `start_date` match and status IN ('reserved', 'pending'), LIMIT 1
- [x] T005 [P] [US1] Create `createReservation` query model in `server/src/models/room.models.mjs` — INSERT INTO `reserve_room` (`user_id`, `avail_id`, `start_date`, `status`) VALUES ($1, $2, $3, 'reserved') RETURNING reserve_id, avail_id, start_date, status
- [x] T006 [US1] Implement `createReservation(userId, availId, startDate)` service in `server/src/services/room.services.mjs` — validates date format, calls `findReservationBySlotAndDate` for conflict check (throws 409 if booked), calls `createReservation` model, returns created record
- [x] T007 [US1] Implement `createReservationController` in `server/src/controllers/room.controllers.mjs` — extracts `availId` and `startDate` from `req.body`, `userId` from `req.user.userId`, validates required fields, calls service, returns 201 on success
- [x] T008 [US1] Add `POST /api/rooms/reserve` route with `verifyToken` middleware in `server/src/routes/room.routes.mjs`

### Frontend: Map Booking Flow

- [x] T009 [P] [US1] Add mode selection popup to `client/app/components/organisms/RoomDetailPanel.tsx` — when a reservable room is clicked, show two options: "Đặt phòng tự do" (Freely, active) and "Đặt phòng study group" (disabled, visual-only)
- [x] T010 [US1] Implement inline booking flow in `client/app/components/organisms/RoomDetailPanel.tsx` — after "Freely" is selected, show date picker (native `<input type="date">`), fetch available slots from existing `GET /api/rooms/availability`, render selectable slot list, add "Confirm" button
- [x] T011 [US1] Connect confirm action to `POST /api/rooms/reserve` in `client/app/components/organisms/RoomDetailPanel.tsx` — send `availId` and `startDate` with auth token, show success confirmation or conflict error

**Checkpoint**: At this point, User Story 1 should be fully functional — users can book a room end-to-end

---

## Phase 4: User Story 2 — View Reservations Dashboard (Priority: P1)

**Goal**: User can see their upcoming room reservations on a dedicated dashboard page, with detailed cards showing room image, status badge, date, time slot, and placeholder action buttons.

**Independent Test**: After booking a room, navigate to Dashboard → click "Room Reservations" in sidebar → see upcoming reservation card(s) with room photo, "Confirmed" teal badge, date, time slot, "Tạo mã PIN" and "Hủy" buttons.

### Backend: User Reservations API

- [ ] T012 [P] [US2] Create `findUserReservations` query model in `server/src/models/room.models.mjs` — SELECT from `reserve_room rr` JOIN `room_avail ra` ON rr.avail_id = ra.avail_id JOIN `study_room sr` ON ra.room_id = sr.room_id WHERE rr.user_id = $1 ORDER BY rr.start_date DESC, ra.start_time ASC, returning: reserve_id, start_date, start_time, end_time, status, room_name, room image img_url, room description, capacity
- [ ] T013 [US2] Implement `getUserReservations(userId)` service in `server/src/services/room.services.mjs` — calls `findUserReservations`, categorizes into upcoming (start_date >= today) and past (start_date < today)
- [ ] T014 [US2] Implement `getUserReservationsController` in `server/src/controllers/room.controllers.mjs` — extracts `userId` from `req.user.userId`, calls service, returns categorized data
- [ ] T015 [US2] Add `GET /api/rooms/user-reservations` route with `verifyToken` middleware in `server/src/routes/room.routes.mjs`

### Frontend: Dashboard Reservations Page

- [x] T016 [P] [US2] Build `ReservationCard` component at `client/app/components/molecules/ReservationCard.tsx` — implements all design elements from FR-013: room photo (48x48 rounded square, fallback beige SVG), status badge (teal "Confirmed" for status "reserved"), room name (bold 20px), description line (floor • wing • amenities), date row with calendar icon, time slot row with clock icon, "Tạo mã PIN" and "Hủy" placeholder buttons, horizontal border separators per FR-014, Cancel button styling per FR-015
- [x] T017 [P] [US2] Style and populate "New Reservation" button in `client/app/dashboard/user/reservations/page.tsx` — dark blue rounded pill (#03192E) with white "+" icon, navigates to /map on click
- [x] T018 [P] [US2] Add pagination arrow components (left/right circles, border #C5C6CD) at top-right of content area in `client/app/dashboard/user/reservations/page.tsx`
- [x] T019 [US2] Connect dashboard page to `GET /api/rooms/user-reservations` — fetch data on mount, render `ReservationCard` components in the "Upcoming" section grid, wire empty state message
- [x] T020 [US2] Add empty state — when no reservations exist, show message "No room reservations yet" with prompt to visit map and make a booking

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 — View Past Bookings (Priority: P2)

**Goal**: User can see their past room reservations in a structured table with columns for room name, date, time slot, duration, and status.

**Independent Test**: After a reserved date has passed, navigate to Dashboard → "Room Reservations" → scroll to "Past Bookings" section → see table with all columns populated.

- [x] T021 [P] [US3] Build `PastBookingsTable` component at `client/app/components/molecules/PastBookingsTable.tsx` — implements FR-017: table with columns ROOM NAME, DATE, TIME SLOT, DURATION, STATUS. Header row: warm beige background (#F8F3E9) with uppercase bold gray labels (#74777D). Data rows populated from props.
- [x] T022 [US3] Integrate `PastBookingsTable` into dashboard page at `client/app/dashboard/user/reservations/page.tsx` — pass past reservations data from GET /api/rooms/user-reservations, filter by start_date < today
- [x] T023 [US3] Calculate and display duration for each past booking row — compute from `start_time` and `end_time` (e.g. "2h 30m" or "3h")

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T024 [P] Update `AGENTS.md` to point plan reference to `specs/025-freely-room-reservation/plan.md`
- [x] T025 Run quickstart.md validation scenarios end-to-end and fix any issues found
- [x] T026 Code cleanup — remove any TODO comments, unused imports, or debug console.log statements from all touched files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (Phase 3) → US2 (Phase 4) recommended sequential order (US2 needs reservations to display, but can work independently with mock data)
  - US3 (Phase 5) depends on US2's page structure but the table component is independent
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — Backend API is independent; frontend can be built with mock data while US1 is in progress
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — Table component is fully independent; integration depends on US2 page structure

### Within Each User Story

- Models before services
- Services before controllers/endpoints
- Backend endpoints before frontend integration
- Components before page integration

### Parallel Opportunities

- T004 and T005 (US1 models) can run in parallel
- T012 (US2 model) is independent of US1 tasks
- T016, T017, T018 (US2 frontend components) can run in parallel
- T021 (US3 table component) can run in parallel with all US2 tasks
- T024 can run at any time

---

## Parallel Example: User Story 1

```bash
# Launch both model queries in parallel:
Task: "Create findReservationBySlotAndDate in server/src/models/room.models.mjs"
Task: "Create createReservation in server/src/models/room.models.mjs"

# After models complete, launch service + frontend mode selection in parallel:
Task: "Implement createReservation service in server/src/services/room.services.mjs"
Task: "Add mode selection popup in client/app/components/organisms/RoomDetailPanel.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch all frontend components in parallel:
Task: "Build ReservationCard component in client/app/components/molecules/ReservationCard.tsx"
Task: "Style New Reservation button in client/app/dashboard/user/reservations/page.tsx"
Task: "Add pagination arrows in client/app/dashboard/user/reservations/page.tsx"

# In parallel with frontend, launch backend:
Task: "Create findUserReservations model in server/src/models/room.models.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T003) — CRITICAL blocks all stories
3. Complete Phase 3: User Story 1 (T004-T011) — end-to-end booking flow
4. **STOP and VALIDATE**: Test US1 independently — book a room from map
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Sidebar navigates to dashboard reservations page
2. Add User Story 1 → Users can book rooms → **MVP delivered**
3. Add User Story 2 → Users can view upcoming reservations in dashboard
4. Add User Story 3 → Users can view past booking history

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 backend (T004-T008) → frontend (T009-T011)
   - Developer B: US2 backend (T012-T015) → frontend cards (T016) → page integration (T019)
   - Developer C: US3 table (T021) → integration (T022-T023) + parallel frontend pieces (T017-T018)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- The POST /api/rooms/reserve endpoint must check for double-booking conflicts (409 response)
- The GET /api/rooms/user-reservations endpoint must resolve room images through the data path: reserve_room → room_avail → study_room
- Status badge: "reserved" DB status → displays as "Confirmed" in teal (#00A694) on light teal background
- Cancel and PIN buttons are UI-only placeholders — no backend wiring
