---

description: "Task list for Room Reservation, Check-In, and Check-Out feature"
---

# Tasks: Room Reservation, Check-In, and Check-Out

**Input**: Design documents from `specs/029-room-checkin-checkout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The server-side service tests follow the existing Vitest convention under `server/tests/`. Tests are written per user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `server/src/` (backend), `client/app/` (frontend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure that this feature builds upon; no new projects or migrations are introduced.

- [x] T001 Verify that `reserve_room.pin`, `reserve_room.expired_at`, `reserve_room.checkin_time`, `reserve_room.status`, `return_room.return_id`, `return_room.reserve_id`, `return_room.checkout_time`, `room_avail.end_time`, and `users.reserve_num` columns already exist in `database/init_db/postgres/05_init_rest.sql`, `database/init_db/postgres/03_datafacility.sql`, and `database/init_db/postgres/04_datauser.sql` (confirm no schema change is required)
- [x] T002 Confirm route mounting convention: `server/src/routes/room.routes.mjs` is mounted at `/api/rooms` in `server/src/server.mjs:32`, and `client/app/utils/apiClient.ts` `apiFetch` prefixes `NEXT_PUBLIC_API_URL`
- [x] T003 [P] Add i18n keys for new UI text (create PIN modal, checkout confirm, librarian room check-in tab, history filters) to `client/app/locales/en.json` and `client/app/locales/vi.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared refactors and extensions that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Refactor the duplicated PIN-generation core shared by `generatePickupPin` and `generateReturnPin` in `server/src/services/dashboard.user.services.mjs` into a reusable parameterized function (target table, id column, status transitions, expiry ms) while preserving existing book behavior exactly
- [x] T005 Extend `cleanupExpiredPins` and `clearAllPins` in `server/src/services/library.services.mjs` to additionally revert `reserve_room` rows with `status = 'pending'` to `'reserved'` and clear `pin`/`expired_at` (expiry-filtered for the periodic run, unfiltered for startup), returning the combined row count; update `server/src/utils/pinScheduler.mjs` logging to report room PINs
- [x] T006 Extend `findUserReservations` in `server/src/models/room.models.mjs` to `LEFT JOIN public.return_room` on `reserve_id` and expose `checkin_time AS "checkinTime"` and `checkout_time AS "checkoutTime"` (foundational: used by both card UI and history)
- [x] T007 [P] Add `reserve_num` lifecycle to `server/src/services/room.services.mjs` and `server/src/models/room.models.mjs`: increment `users.reserve_num` by 1 inside the existing `createReservation` flow, and decrement (`GREATEST(reserve_num - 1, 0)`) inside the existing `cancelReservation` flow — leave study-group reservation creation (`server/src/models/study-group.models.mjs`) untouched
- [x] T007a [P] Add the per-user room reservation limit guard to `server/src/services/room.services.mjs`: define `MAX_ROOM_RESERVE_LIMIT = 5` (mirrors `MAX_BORROW_LIMIT` in `library.services.mjs:6`); in `createReservation`, read the user's `reserve_num` (via `room.models.mjs`) and reject with `ROOM_RESERVE_LIMIT_EXCEEDED` (HTTP 400, message including the limit) before inserting when `reserve_num >= MAX_ROOM_RESERVE_LIMIT` — check and increment in the same transaction to avoid races; and write the matching Vitest cases (increment on create, reject at limit, decrement on cancel) in `server/tests/services/room.services.spec.mjs`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - User Generates a PIN for an Upcoming Reservation (Priority: P1) 🎯 MVP

**Goal**: A user with an upcoming `reserved` reservation generates a 6-digit PIN valid for 3 minutes; reservation becomes `pending`; PIN modal shows with countdown.

**Independent Test**: Log in as a user with an upcoming reservation, click "Create PIN", verify a PIN appears in a modal with a 3-minute countdown, and `reserve_room.status = 'pending'`. Re-open the modal before expiry to confirm the same PIN is returned.

### Tests for User Story 1 ⚠️

- [x] T008 [P] [US1] Write Vitest service tests for room PIN generation (idempotent existing-PIN return, status transition to pending, 3-minute expiry, unique retry) in `server/tests/services/room.services.spec.mjs` — run `cd server && npx vitest run tests/services/room.services.spec.mjs`

### Implementation for User Story 1
- [x] T009 [P] [US1] Add `generateRoomPin` and `cleanupRoomPin` model functions in `server/src/models/room.models.mjs` (check ownership + `reserved`/`pending` status, fetch existing active PIN, reset stale PIN, update `pin`/`expired_at`/`status`)

- [x] T010 [US1] Add `generateRoomPin(userId, reserveId)` and `cleanupRoomPin(userId, reserveId)` services in `server/src/services/room.services.mjs` reusing the Phase 2 shared PIN core with 3-minute expiry (returns `{ pin, expiresAt }`; error codes `RESERVATION_NOT_FOUND`, `PIN_GENERATION_FAILED`) (depends on T004, T009)
- [x] T011 [US1] Add `generateRoomPinController` and `cleanupRoomPinController` in `server/src/controllers/room.controllers.mjs` (require `req.user.userId`, validate `reserveId` param, use unified JSON envelope)
- [x] T012 [US1] Register `POST /api/rooms/reserve/:reserveId/pin` and `POST /api/rooms/reserve/:reserveId/pin/cleanup` (both `verifyToken`) in `server/src/routes/room.routes.mjs` (depends on T011)
- [x] T013 [US1] Wire the "Create PIN" button in `client/app/components/molecules/ReservationCard.tsx` to call the PIN endpoint via `apiFetch`, open `client/app/components/organisms/PinModal.tsx` with the returned PIN and `useCountdownFromDate` countdown, and surface the same PIN idempotently on reopen (depends on T012)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Librarian Verifies the PIN and Checks In the User (Priority: P1)

**Goal**: A librarian enters a pending room PIN, reviews reservation/user/room details, and confirms check-in; `checkin_time` is set, PIN data cleared, status `used`.

**Independent Test**: As a librarian, enter a valid pending PIN on the "Confirm Room Check-in" tab and confirm — verify `reserve_room.status = 'used'`, `checkin_time` populated, `pin`/`expired_at` NULL. Enter an invalid/expired PIN to confirm the error path.

### Tests for User Story 2 ⚠️

- [x] T014 [P] [US2] Write Vitest service tests for room PIN verification and check-in confirmation (valid PIN returns details, invalid/expired PIN returns `PIN_NOT_FOUND`, confirm transitions to `used` and clears PIN, re-confirm rejected) in `server/tests/services/dashboard.librarian.services.spec.mjs`

### Implementation for User Story 2

- [x] T015 [P] [US2] Add `findPendingRoomReservationByPin` and `confirmRoomCheckin` model functions in `server/src/models/room.models.mjs` (find by `pin` + `status = 'pending'` + `expired_at > NOW()`; transactional update with ownership and status guards)
- [x] T016 [US2] Add `verifyRoomPin(pin)` and `confirmRoomCheckin(reserveId)` services in `server/src/services/dashboard.librarian.services.mjs` (join `users` and `room_avail`→`study_room` for details; transactional confirm via `pool.connect()` + `BEGIN/COMMIT/ROLLBACK`) (depends on T015)
- [x] T017 [US2] Add `verifyRoomPinController` and `confirmRoomCheckinController` in `server/src/controllers/dashboard.librarian.controllers.mjs` (validate 6-digit PIN; error `PIN_NOT_FOUND` 404, `NOT_FOUND`/`ALREADY_USED` on confirm)
- [x] T018 [US2] Register `POST /dashboard/librarian/verify-room-pin` and `POST /dashboard/librarian/confirm-room-checkin` (both `verifyToken`, `authorizeRole('librarian')`) in `server/src/routes/dashboard.librarian.routes.mjs` (depends on T017)
- [x] T019 [US2] Create `RoomCheckinTab` organism in `client/app/components/organisms/RoomCheckinTab.tsx` (OTPInput PIN entry → details step showing user/room/reservation → confirm step), reusing the `InlinePinVerification` step pattern and `apiFetch`
- [x] T020 [US2] Register the room check-in tab in `client/app/components/templates/LibrarianBookDashboard.tsx` by extending the `SubTabBar` tab list with a `room_checkin` tab rendering `RoomCheckinTab` (depends on T019)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - User Confirms Check-Out After the Reservation Ends (Priority: P2)

**Goal**: Once the reservation slot has elapsed and the reservation is `used`, the room card shows "Checkout Confirm"; clicking it creates a `return_room` record and decrements `users.reserve_num`. A scheduler backfill defaults `checkout_time` to the slot `end_time` if the user never confirms.

**Independent Test**: After check-in, wait for the slot `end_time` to pass, click "Checkout Confirm", and verify a single `return_room` row with `checkout_time` ≈ confirmation time and `users.reserve_num` decremented by 1. In a separate reservation, skip confirmation and verify the backfill creates the record with `checkout_time = end_time`.

### Tests for User Story 3 ⚠️

- [x] T021 [P] [US3] Write Vitest service tests for checkout confirmation (creates `return_room`, decrements `reserve_num`, idempotent on duplicate call, rejects not-`used`/not-elapsed) and checkout defaulting backfill (uses slot `end_time`, `WHERE NOT EXISTS`) in `server/tests/services/room.services.spec.mjs`

### Implementation for User Story 3

- [x] T022 [P] [US3] Add `findReturnRecord`, `checkoutRoom`, and `backfillDefaultedCheckouts` model functions in `server/src/models/room.models.mjs` (idempotent `INSERT INTO public.return_room ... WHERE NOT EXISTS`, join `room_avail` for `end_time`, `UPDATE public.users SET reserve_num = GREATEST(reserve_num - 1, 0)`)
- [x] T023 [US3] Add `confirmCheckout(userId, reserveId)` service in `server/src/services/room.services.mjs` (validate ownership + `status = 'used'` + slot elapsed; transactional insert + `reserve_num` decrement; return existing record if already returned) (depends on T022)
- [x] T024 [US3] Add `confirmCheckoutController` in `server/src/controllers/room.controllers.mjs` (error codes `RESERVATION_NOT_FOUND` 404, `CHECKOUT_NOT_ELIGIBLE` 409)
- [x] T025 [US3] Register `POST /api/rooms/reserve/:reserveId/checkout` (`verifyToken`) in `server/src/routes/room.routes.mjs` (depends on T024)
- [x] T026 [US3] Add checkout defaulting to `server/src/utils/pinScheduler.mjs`: for `used` reservations with `checkin_time` set whose `start_date + end_time < NOW()` and no `return_room` row, insert `return_room` with `checkout_time` = `start_date + end_time` and decrement `reserve_num`; wire into `runStartupPinCleanup` and `startPeriodicPinCleanup` (depends on T022)
- [x] T027 [US3] In `client/app/components/molecules/ReservationCard.tsx`, render a "Checkout Confirm" button (replacing "Create PIN"/"Cancel") when `reservation.status === 'used'` and the slot has elapsed; call the checkout endpoint and refresh the reservation list via the page callback (depends on T025)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently.

---

## Phase 6: User Story 4 - User Views Room Reservation History (Priority: P3)

**Goal**: The room reservation history view supports date-based filtering and displays `checkinTime` (from `reserve_room`) and `checkoutTime` (from `return_room`).

**Independent Test**: Open the history view, apply a date range, and confirm only in-range reservations appear with populated check-in/check-out times; an empty range returns an empty list.

### Tests for User Story 4 ⚠️

- [x] T028 [P] [US4] Write Vitest service tests for the history query (inclusive `from`/`to` filtering on `start_date`, `checkinTime`/`checkoutTime` populated via join, ordering `start_date DESC`) in `server/tests/services/room.services.spec.mjs`

### Implementation for User Story 4

- [x] T029 [P] [US4] Add `findRoomHistory(userId, from, to)` model function in `server/src/models/room.models.mjs` (optional inclusive date-range filters on `start_date`, join `return_room`, expose `checkinTime`/`checkoutTime`, order `start_date DESC`) (reuses Phase 2 query extension)
- [x] T030 [US4] Add `getRoomHistory(userId, from, to)` service in `server/src/services/room.services.mjs` validating `YYYY-MM-DD` params (depends on T029)
- [x] T031 [US4] Add `getRoomHistoryController` in `server/src/controllers/room.controllers.mjs` (read `from`/`to` from `req.query`, require `req.user.userId`)
- [x] T032 [US4] Register `GET /api/rooms/history` (`verifyToken`) in `server/src/routes/room.routes.mjs` (depends on T031)
- [x] T033 [US4] Add date-range filter controls and `checkinTime`/`checkoutTime` columns to `client/app/dashboard/user/reservations/page.tsx` and the past-bookings table component, fetching `GET /api/rooms/history` (depends on T032)

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation.

- [x] T034 Run the full server test suite: `cd server && npm test` (all existing + new service tests pass)
- [x] T035 Run frontend lint/typecheck: `cd client && npm run lint` (and `npx tsc --noEmit` if available)
- [x] T036 Verify all new UI text resolves via i18n keys in `client/app/locales/en.json` and `client/app/locales/vi.json` and uses dark-mode utilities / design tokens on all changed components
- [ ] T037 [P] Execute the end-to-end validation scenarios in `specs/029-room-checkin-checkout/quickstart.md` (PIN generation, expiry cleanup, librarian check-in, checkout confirmation, checkout defaulting, date-filtered history, `reserve_num` count changes, `ROOM_RESERVE_LIMIT_EXCEEDED` at the per-user limit) against the running app

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 → US2 → US3 are sequential in data flow (PIN → verify → checkout), but each is independently implementable/testable once Foundational is done
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Depends on US1 for realistic end-to-end flow, but independently testable with seeded data
- **User Story 3 (P2)**: Can start after Foundational - Depends on US2 (status `used`) for the primary path, but checkout backfill is testable independently
- **User Story 4 (P3)**: Can start after Foundational - Depends on T006 (Phase 2 query extension) for `checkinTime`/`checkoutTime`

### Within Each User Story

- Tests MUST be written and FAIL before implementation (T008, T014, T021, T028)
- Models before services (T009 → T010; T015 → T016; T022 → T023; T029 → T030)
- Services before controllers/routes (T010 → T011 → T012; T016 → T017 → T018; T023 → T024 → T025; T030 → T031 → T032)
- Implementation before frontend integration (T013, T020, T027, T033)

### Parallel Opportunities

- Phase 1: T003 [P] parallel with T001/T002
- Phase 2: All tasks sequential (shared refactor must land first); T005/T006/T007 can run in parallel after T004 if carefully reviewed; T007a (limit guard + its tests) is [P] with T007 but shares `room.services.mjs`
- Test tasks within each story are [P] against implementation tasks (write-first pattern)
- Model tasks T009, T015, T022, T029 are [P] across their own stories
- Different user stories can be worked on in parallel by different team members after Phase 2

---

## Parallel Example: User Story 1

```bash
# Launch test + model together (write test first, then model):
Task: "Write room PIN generation tests in server/tests/services/room.services.spec.mjs"
Task: "Add generateRoomPin/cleanupRoomPin model functions in server/src/models/room.models.mjs"

# After model + service land, launch controller + route:
Task: "Add generateRoomPinController in server/src/controllers/room.controllers.mjs"
Task: "Register PIN routes in server/src/routes/room.routes.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (user PIN generation)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (PIN generation) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (librarian check-in) → Test independently → Deploy/Demo
4. Add User Story 3 (check-out) → Test independently → Deploy/Demo
5. Add User Story 4 (history) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (PIN generation)
   - Developer B: User Story 2 (librarian check-in) with seeded data
   - Developer C: User Story 4 (history) — no dependency on US1/US2
3. Developer A then continues to User Story 3 (check-out) once US2 completes
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **No database schema changes** — verify columns in Phase 1 T001 before implementation
- **`reserve_num` lifecycle**: increment on reservation creation (T007), decrement on cancel (T007) and on checkout (T022/T023/T026)
- **Per-user room limit**: `MAX_ROOM_RESERVE_LIMIT = 5` in `room.services.mjs`; `createReservation` rejects `ROOM_RESERVE_LIMIT_EXCEEDED` (400) when `reserve_num >= MAX_ROOM_RESERVE_LIMIT` (T007a); mirrors `MAX_BORROW_LIMIT` / `BORROW_LIMIT_EXCEEDED`
