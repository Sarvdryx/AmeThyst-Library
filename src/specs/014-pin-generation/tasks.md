# Tasks: PIN Generation for Book Pickup

**Input**: Design documents from `/specs/014-pin-generation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not requested — spec uses manual validation via quickstart.md.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: i18n keys and shared backend utilities needed by all stories

- [ ] T001 [P] Add PIN-related i18n keys to `src/client/app/locales/en.json` (pin.title, pin.view_pin, pin.expires_in, pin.expired, pin.generated, pin.close, pin.countdown)
- [ ] T002 [P] Add PIN-related i18n keys to `src/client/app/locales/vi.json` (Vietnamese translations for same keys)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend PIN generation service and cancel modification — MUST complete before frontend work

**⚠️ CRITICAL**: No user story frontend work can begin until this phase is complete

- [ ] T003 Implement `generatePickupPin` service function in `src/server/src/services/library.services.mjs` — generates unique 6-digit PIN, checks uniqueness, updates borrow_book (pin, expired_at, status), returns { pin, expiresAt }
- [ ] T004 Implement `cleanupExpiredPins` service function in `src/server/src/services/library.services.mjs` — UPDATE borrow_book SET pin=NULL, expired_at=NULL, status='reserved' WHERE status='pending' AND expired_at < NOW()
- [ ] T005 Implement `clearAllPins` service function in `src/server/src/services/library.services.mjs` — UPDATE borrow_book SET pin=NULL, expired_at=NULL, status='reserved' WHERE status='pending'
- [ ] T006 Add periodic cleanup interval in `src/server/src/server.mjs` — setInterval(cleanupExpiredPins, 60000) after pool initialization
- [ ] T007 Add startup PIN cleanup call in `src/server/src/server.mjs` — call clearAllPins() before app.listen()
- [ ] T008 Add `generatePickupPin` controller handler in `src/server/src/controllers/library.controller.mjs` — validates userId, calls service, returns { pin, expiresAt, status }
- [ ] T009 Add `POST /api/library/reserve/:reservationId/pin` route in `src/server/src/routes/library.mjs` — authenticated with verifyToken middleware
- [ ] T010 Modify `cancelReservationById` in `src/server/src/services/library.services.mjs` — remove status !== 'pending' guard at line 314 to allow both 'reserved' and 'pending' status cancellation; update error message to "Only reserved or pending reservations can be cancelled"

**Checkpoint**: Backend ready — all API endpoints functional, cleanup running

---

## Phase 3: User Story 1 — Generate Pickup PIN (Priority: P1) 🎯 MVP

**Goal**: User can click "View PIN" on a reserved book card, backend generates a 6-digit PIN, frontend displays it in a modal with countdown

**Independent Test**: Navigate to /dashboard/user/borrowed, click "View PIN" on a reserved book, verify 6-digit PIN appears in modal with 5-minute countdown

### Implementation for User Story 1

- [ ] T011 [US1] Add `pin?: string` field to `BorrowedBook` interface in `src/client/app/components/molecules/BorrowedBookCard.tsx`
- [ ] T012 [US1] Add `onViewPin?: (id: string) => void` prop to `BorrowedBookCard` component props interface in `src/client/app/components/molecules/BorrowedBookCard.tsx`
- [ ] T013 [US1] Render "View PIN" button for `status === 'reserved'` in `BorrowedBookCard.tsx` — styled like existing Cancel button, positioned before Cancel, calls `onViewPin(book.id)`
- [ ] T014 [US1] Create `PinModal` organism component in `src/client/app/components/organisms/PinModal.tsx` — receives `pin: string`, `expiresAt: string`, `onClose: () => void` props; renders modal overlay with PIN display and countdown timer using `useEffect` + `setInterval`
- [ ] T015 [US1] Export `PinModal` from `src/client/app/components/organisms/index.ts`
- [ ] T016 [US1] Add PIN modal state management in `src/client/app/dashboard/user/borrowed/page.tsx` — useState for `pinModalData` (pin, expiresAt, isOpen), `handleViewPin` function that calls `POST /api/library/reserve/:id/pin` and opens modal
- [ ] T017 [US1] Wire `onViewPin` prop to `BorrowedBookCard` in `src/client/app/dashboard/user/borrowed/page.tsx` — pass handleViewPin callback
- [ ] T018 [US1] Render `PinModal` in `src/client/app/dashboard/user/borrowed/page.tsx` — conditional render when pinModalData.isOpen is true

**Checkpoint**: User Story 1 fully functional — PIN generation and display working end-to-end

---

## Phase 4: User Story 2 — PIN Expiration & Cleanup (Priority: P2)

**Goal**: Expired PINs are automatically cleared and status reverts to reserved; server startup flushes all PINs

**Independent Test**: Generate a PIN, wait 5 minutes (or manually set expired_at to past), verify PIN cleared and status reverted; restart server, verify all pending statuses reverted

### Implementation for User Story 2

- [ ] T019 [US2] Verify periodic cleanup works by generating a PIN and observing automatic reversion after 5 minutes (manual validation per quickstart.md Scenario 3)
- [ ] T020 [US2] Verify server startup cleanup works by manually setting pending status, restarting server, and confirming reversion (manual validation per quickstart.md Scenario 4)
- [ ] T021 [US2] Handle countdown expiry in `PinModal.tsx` — when countdown reaches 0, display "PIN Expired" message with option to close and regenerate

**Checkpoint**: User Story 2 fully functional — cleanup and expiry working

---

## Phase 5: User Story 3 — PIN Display Persistence (Priority: P3)

**Goal**: User can close and reopen PIN modal to view the same active PIN with updated countdown

**Independent Test**: Generate a PIN, close modal, reopen it, confirm same PIN with correct remaining time is displayed

### Implementation for User Story 3

- [ ] T022 [US3] Ensure PinModal closes cleanly without clearing PIN data in `src/client/app/components/organisms/PinModal.tsx` — onClose callback only hides modal, does not invalidate PIN
- [ ] T023 [US3] Ensure "View PIN" button re-triggers API call for existing active PIN in `src/client/app/dashboard/user/borrowed/page.tsx` — handleViewPin calls POST endpoint which returns existing PIN if still valid
- [ ] T024 [US3] Verify countdown timer resets correctly when modal is reopened in `PinModal.tsx` — useEffect recalculates remaining time from expiresAt on mount

**Checkpoint**: User Story 3 fully functional — modal persistence working

---

## Phase 6: User Story 4 — Cancel Reservation (Priority: P1)

**Goal**: User can cancel reservations in both "reserved" and "pending" status, deleting the row from borrow_book

**Independent Test**: Click Cancel on a reserved book card, verify row deleted and inventory restored; click Cancel on a pending book card (with active PIN), verify row deleted and PIN cleared

### Implementation for User Story 4

- [ ] T025 [US4] Extend Cancel button rendering condition in `src/client/app/components/molecules/BorrowedBookCard.tsx` — change `book.status === 'pending'` to `book.status === 'pending' || book.status === 'reserved'`
- [ ] T026 [US4] Verify cancel works for 'reserved' status via frontend — manual validation per quickstart.md Scenario 8
- [ ] T027 [US4] Verify cancel works for 'pending' status (with active PIN) via frontend — manual validation per quickstart.md Scenario 9

**Checkpoint**: User Story 4 fully functional — cancel working for both statuses

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final touches and validation

- [ ] T028 [P] Add success toast notification for successful PIN generation in `src/client/app/dashboard/user/borrowed/page.tsx`
- [ ] T029 [P] Add success toast notification for successful reservation cancellation in `src/client/app/dashboard/user/borrowed/page.tsx`
- [ ] T030 [P] Add error toast notifications for API failures (NOT_PENDING, CANNOT_CANCEL, NOT_FOUND, FORBIDDEN) in `src/client/app/dashboard/user/borrowed/page.tsx`
- [ ] T031 Verify all dark mode styles work correctly for PinModal and new buttons (Tailwind `dark:` classes)
- [ ] T032 Run quickstart.md full validation suite — all 10 scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — core MVP
- **Phase 4 (US2)**: Depends on Phase 2 — can run parallel with US1 (backend cleanup is independent of frontend)
- **Phase 5 (US3)**: Depends on Phase 3 (needs PinModal from US1)
- **Phase 6 (US4)**: Depends on Phase 2 — can run parallel with US1/US2/US3
- **Phase 7 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Generate PIN, P1)**: Can start after Phase 2 — No dependencies on other stories
- **US2 (Expiration & Cleanup, P2)**: Can start after Phase 2 — Backend tasks are in Phase 2; frontend countdown expiry in PinModal depends on US1
- **US3 (Display Persistence, P3)**: Depends on US1 (needs PinModal component)
- **US4 (Cancel Reservation, P1)**: Can start after Phase 2 — Independent of US1/US2/US3

### Within Each User Story

- Interface/type changes before component rendering
- Component creation before page integration
- Service calls before UI wiring
- Core implementation before polish

### Parallel Opportunities

- T001 + T002 (i18n keys en/vi) — parallel
- T003–T010 (all backend tasks) — sequential within story, but can be batched
- T011–T013 (BorrowedBookCard changes) — sequential
- T014–T015 (PinModal creation + export) — parallel with T011–T013
- T028–T030 (toast notifications) — parallel
- US1 and US4 can be worked on in parallel after Phase 2

---

## Parallel Example: Phase 2 Backend

```bash
# All backend service functions can be implemented in sequence:
Task T003: generatePickupPin in library.services.mjs
Task T004: cleanupExpiredPins in library.services.mjs
Task T005: clearAllPins in library.services.mjs

# Then server wiring:
Task T006: periodic cleanup in server.mjs
Task T007: startup cleanup in server.mjs

# Then controller + route:
Task T008: controller handler in library.controller.mjs
Task T009: route in library.mjs
Task T010: modify cancelReservationById in library.services.mjs
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (i18n keys)
2. Complete Phase 2: Foundational (backend PIN generation + cancel modification)
3. Complete Phase 3: User Story 1 (PIN generation + modal display)
4. **STOP and VALIDATE**: Test PIN generation per quickstart.md Scenarios 1-2
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1+2 → Backend ready, i18n ready
2. Phase 3 (US1) → PIN generation + display working → Deploy/Demo (MVP!)
3. Phase 4 (US2) → Cleanup verified → Deploy/Demo
4. Phase 5 (US3) → Modal persistence working → Deploy/Demo
5. Phase 6 (US4) → Cancel for both statuses → Deploy/Demo
6. Phase 7 → Polish complete → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1+2 together
2. Once Phase 2 is done:
   - Developer A: US1 (PIN generation + modal)
   - Developer B: US4 (Cancel reservation)
3. US1 complete → Developer A picks up US3 (modal persistence)
4. All stories complete → Phase 7 polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks — spec uses manual validation via quickstart.md
- The `borrow_book` table already has `pin` and `expired_at` columns — no migration needed
- The existing CHECK constraint already allows `pending` status
- The existing UNIQUE constraint on `pin` ensures collision safety
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
