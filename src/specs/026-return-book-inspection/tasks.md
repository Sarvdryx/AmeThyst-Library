# Tasks: Book Return & Inspection System

**Input**: Design documents from `/specs/026-return-book-inspection/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `server/src/`, `client/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — no code changes needed, existing project is already set up. Verify prerequisites.

- [X] T001 Confirm PostgreSQL tables exist: `return_book`, `book_penalty`, `borrow_book` with all required columns per data-model.md
- [X] T002 Confirm `borrow_book.status` supports `'pending_return'` (add to CHECK constraint if missing)
- [X] T003 Confirm `cleanupExpiredPins` in `server/src/services/library.services.mjs` includes `'pending_return'` status in its WHERE clause
- [X] T004 Confirm `clearAllPins` in `server/src/services/library.services.mjs` includes `'pending_return'` status

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Add `generateReturnPin` service function in `server/src/services/dashboard.user.services.mjs` (follows `generatePickupPin` pattern: 6-digit PIN, 3-min expiry, uniqueness retry, sets status to `'pending_return'`, no branch constraint)
- [X] T006 [P] Add `verifyReturnPin` service function in `server/src/services/dashboard.librarian.services.mjs` that calls `findBorrowRecordByPin(pin, 'pending_return')` and skips branch check
- [X] T007 [P] Add penalty calculation pure function `calculatePenalty(conditions, bookPrice, overdueDays)` in `server/src/utils/penalty.utils.mjs` implementing the damage formula and overdue formula per data-model.md
- [X] T008 [P] Add `confirmReturn` service function in `server/src/services/dashboard.librarian.services.mjs` with transaction logic (`BEGIN/COMMIT/ROLLBACK`) routing records to correct tables per scenario (perfect, lost, damaged, damaged+overdue)
- [X] T009 Add `getOutstandingDebts` service function in `server/src/services/dashboard.librarian.services.mjs` querying `book_penalty` where `is_paid = false`, join with `users` for username search
- [X] T010 Add `confirmPayment` service function in `server/src/services/dashboard.librarian.services.mjs` updating `is_paid = true` and `paid_at = NOW()` in `book_penalty`
- [X] T011 Add `getUserFees` service function in `server/src/services/dashboard.user.services.mjs` returning outstanding and history penalties for current user from `book_penalty`
- [X] T012 Add `getBorrowingHistory` service function in `server/src/services/dashboard.user.services.mjs` querying `return_book` joined with `borrow_book` → `books` for user's return history

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Generate Return PIN (Priority: P1) 🎯 MVP

**Goal**: User can generate a return PIN from their borrowed books page, enabling them to initiate return at any branch.

**Independent Test**: Navigate to borrowed books page, click "Generate Return PIN" on a borrowed book card, verify 6-digit PIN displays with 3-minute countdown and status changes to `'pending_return'`.

### Backend

- [X] T013 [P] [US1] Add route `POST /api/user/borrowed/generate-return-pin` in `server/src/routes/dashboard.user.routes.mjs` with `verifyToken` middleware
- [X] T014 [P] [US1] Add `generateReturnPin` controller in `server/src/controllers/dashboard.user.controllers.mjs`
- [X] T015 [US1] Wire `generateReturnPin` route → controller → service (uses T005 service)
- [X] T016 [US1] Add i18n keys for return PIN messages in `client/app/locales/en.json` and `client/app/locales/vi.json`

### Frontend

- [X] T017 [P] [US1] Add "Generate Return PIN" button to borrowed book card in `client/app/components/molecules/BorrowedBookCard.tsx` — visible only when `status = "borrowed"`
- [X] T018 [US1] Integrate PIN display UI (reuse existing PinModal component) to show generated PIN with 3-minute countdown timer
- [X] T019 [US1] Handle API responses: display generated PIN on success, show error message on failure

**Checkpoint**: At this point, User Story 1 should be fully functional — user can generate and see a return PIN.

---

## Phase 4: User Story 2 — Librarian PIN Verification (Priority: P1)

**Goal**: Librarian can verify a user's return PIN on the Inspection tab and view the borrowing record details.

**Independent Test**: Navigate to Inspection tab, enter a valid return PIN, verify user/book/borrowing details are displayed correctly.

### Backend

- [X] T020 [P] [US2] Add route `POST /api/librarian/verify-return-pin` in `server/src/routes/dashboard.librarian.routes.mjs` with `verifyToken` + `authorizeRole('librarian')`
- [X] T021 [P] [US2] Add `verifyReturnPin` controller in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T022 [US2] Wire `verifyReturnPin` route → controller → service (uses T006 service)
- [X] T023 [US2] Add i18n keys for return PIN verification messages in translation files

### Frontend

- [X] T024 [P] [US2] `ConditionCheckbox` atom already exists at `client/app/components/atoms/ConditionCheckbox.tsx`
- [X] T025 [P] [US2] Create `ConditionSelector` molecule in `client/app/components/molecules/ConditionSelector.tsx` — grid of 11 condition buttons with mutual exclusion rules (FR-012 to FR-014)
- [X] T026 [P] [US2] Create `BorrowInfoPanel` molecule in `client/app/components/molecules/BorrowInfoPanel.tsx` — displays user info, book info, and borrowing info per FR-009 to FR-011
- [X] T027 [US2] Create `InspectionPanel` organism in `client/app/components/organisms/InspectionPanel.tsx` — combines `BorrowInfoPanel` + `ConditionSelector` + description field

**Checkpoint**: At this point, Librarian can verify PIN and see the inspection UI with all details.

---

## Phase 5: User Story 3 — Book Condition Assessment (Priority: P1)

**Goal**: Librarian can select damage conditions with proper mutual exclusion and add description notes.

**Independent Test**: Open inspection UI, select each condition type and verify mutual exclusion rules, verify description field enable/disable behavior.

- [X] T028 [P] [US3] Add i18n keys for all 11 condition labels in translation files
- [X] T029 [US3] Implement mutual exclusion logic in `ConditionSelector` (selecting "Perfect condition" or "Lost" disables all others per FR-013, FR-014)
- [X] T030 [US3] Implement description field disabled-by-default behavior, enabled only when damage conditions are selected (per FR-015)
- [X] T031 [US3] Add visual indication of selected conditions (highlighted/checked state via ConditionCheckbox) and display running damage coefficient list

**Checkpoint**: Condition selection UI complete with all interaction rules.

---

## Phase 6: User Story 4 & 5 — Return Confirmation (Priority: P1)

**Goal**: System calculates penalty using coefficient-based formula, persists records correctly per scenario, updates inventory for perfect returns.

**Independent Test**: Call confirm-return API with various condition combinations and verify penalty calculation matches formula, correct tables affected, inventory updated for perfect condition.

### Backend

- [X] T032 [P] [US4] Add route `POST /api/librarian/confirm-return` in `server/src/routes/dashboard.librarian.routes.mjs` with `verifyToken` + `authorizeRole('librarian')`
- [X] T033 [P] [US4] Add `confirmReturn` controller in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T034 [US4] Wire `confirmReturn` route → controller → service (uses T007 + T008 services)
- [X] T035 [US4] Implement penalty formula: `cost = (x * m_max) + Fee_admin + (N_errors - 1) * Fee_addon` with cap at book's lost penalty amount (FR-016, FR-017)
- [X] T036 [US4] Implement overdue formula: `overdue_cost = 5% * price + (x - 3) * 2% * price` (FR-019)
- [X] T037 [US5] Implement transaction logic routing records per scenario (FR-021 to FR-024)
- [X] T038 [US5] Implement inventory update: increment `available_quantity` for perfect condition returns (FR-025)
- [X] T039 [US5] Add i18n keys for return confirmation messages in translation files

### Frontend

- [X] T040 [US4] Add penalty preview display to `InspectionPanel` — show calculated cost based on selected conditions and overdue status
- [X] T041 [US4] Add "Confirm Return" button in `InspectionPanel` that calls the confirm-return API
- [X] T042 [US5] Add success/error feedback after return confirmation (toast/notification per Constitution Principle III)

**Checkpoint**: Complete return flow works end-to-end: PIN generate → verify → inspect → confirm.

---

## Phase 7: User Story 6 — User Borrowing History (Priority: P2)

**Goal**: User can view their borrowing history including return dates, branch name, and overdue status.

**Independent Test**: Navigate to borrowing history page, verify return data (branch name, return date, overdue status, book image/title/author) displays for completed returns.

### Backend

- [X] T043 [P] [US6] Add route `GET /api/user/borrowing-history` in `server/src/routes/dashboard.user.routes.mjs` with `verifyToken`
- [X] T044 [P] [US6] Add `getBorrowingHistory` controller in `server/src/controllers/dashboard.user.controllers.mjs`
- [X] T045 [US6] Wire route → controller → service (uses T012 service)

### Frontend

- [X] T046 [US6] Reuse existing `BorrowedHistoryTable` component and extend to display return data columns (branch name, return date, overdue status per FR-027)
- [X] T047 [US6] Add i18n keys for borrowing history column headers in translation files

**Checkpoint**: User can see complete return history.

---

## Phase 8: User Story 7 — Payment & Debt Management (Priority: P1)

**Goal**: Librarian can view outstanding debts and confirm payments; user can see their fees history.

**Independent Test**: Navigate to Loan & Fees tab, verify outstanding debts display, search by username, confirm payment, verify user's Fees tab reflects the update.

### Backend

- [X] T048 [P] [US7] Add route `GET /api/librarian/loan-fees/outstanding` in `server/src/routes/dashboard.librarian.routes.mjs` with `verifyToken` + `authorizeRole('librarian')`
- [X] T049 [P] [US7] Add `getOutstandingDebts` controller in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T050 [P] [US7] Add route `POST /api/librarian/loan-fees/confirm-payment` in `server/src/routes/dashboard.librarian.routes.mjs` with `verifyToken` + `authorizeRole('librarian')`
- [X] T051 [P] [US7] Add `confirmPayment` controller in `server/src/controllers/dashboard.librarian.controllers.mjs`
- [X] T052 [US7] Wire outstanding debts route → controller → service (uses T009 service)
- [X] T053 [US7] Wire confirm payment route → controller → service (uses T010 service)
- [X] T054 [P] [US7] Add route `GET /api/user/fees` in `server/src/routes/dashboard.user.routes.mjs` with `verifyToken`
- [X] T055 [P] [US7] Add `getUserFees` controller in `server/src/controllers/dashboard.user.controllers.mjs`
- [X] T056 [US7] Wire user fees route → controller → service (uses T011 service)
- [X] T057 [US7] Add i18n keys for fees/payment messages in translation files

### Frontend

- [X] T058 [P] [US7] Add "Loan & Fees" sub-tab in librarian's Books tab (FR-029) — added to `SubTabBar` and `LibrarianBookDashboard`
- [X] T059 [P] [US7] Create `LoanFeesPanel` organism — outstanding debts table with username search and confirm payment button (FR-030, FR-031, FR-032)
- [X] T060 [US7] Implement search-by-username filtering in `LoanFeesPanel` — debounced query sends `?search=` param (FR-031)
- [X] T061 [US7] Implement confirm payment flow — `POST /dashboard/librarian/confirm-payment` with `penalty_id` (FR-033)
- [X] T062 [P] [US7] Create User Fees tab page at `client/app/dashboard/user/fees/page.tsx` — wired to real API (FR-034)
- [X] T063 [US7] User Fees tab and Librarian Loan & Fees tab both fetch from the same DB — synchronized by shared API (FR-035, FR-039)

**Checkpoint**: Complete payment management flow — librarian manages debts, user views fees.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T064 [P] Review all new UI for dark mode compliance — 4 minor issues fixed (PenaltyDisplay, InspectionPanel btn, ReturnFlowPanel ring, BorrowInfoPanel labels)
- [X] T065 [P] Review all hardcoded text and ensure i18n keys exist in both `en.json` and `vi.json` — all keys present
- [X] T066 [P] Remove any mock data per FR-038 — User Fees page wired to real API; InspectionTab orphaned (no longer imported)
- [ ] T067 Run `quickstart.md` validation scenarios end-to-end to verify all user stories work
- [ ] T068 Run backend tests: `cd server && npx vitest run` to ensure no regressions
- [ ] T069 Verify backward compatibility — all existing library features continue to function (SC-010)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify existing infrastructure
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on Phase 2 (PIN verification service) + Phase 3 (needs a PIN to verify)
- **US3 (Phase 5)**: Depends on Phase 4 (needs inspection UI with BorrowInfoPanel)
- **US4+US5 (Phase 6)**: Depends on Phase 5 (needs condition selection to calculate penalty)
- **US6 (Phase 7)**: Depends on Phase 2 only (can start independently after foundational)
- **US7 (Phase 8)**: Depends on Phase 6 (needs penalties to exist in DB)
- **Polish (Phase 9)**: Depends on all desired stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — independent
- **US2 (P1)**: Depends on US1 (needs a PIN to verify)
- **US3 (P1)**: Depends on US2 (needs verified borrow record)
- **US4+US5 (P1)**: Depends on US3 (needs selected conditions)
- **US6 (P2)**: Can start after Foundational — independent of other P1 stories
- **US7 (P1)**: Depends on US4+US5 (needs persisted penalties)

### Within Each User Story

- Backend (routes → controllers → services) before frontend
- Services before controllers
- Controllers before routes
- Core implementation before integration
- Story complete before moving to next

### Parallel Opportunities

- All Phase 2 Foundational tasks marked [P] can run in parallel
- All tasks within a single story's backend phase marked [P] can run in parallel
- US6 can be started in parallel with US1-5 since it only depends on Phase 2
- Different user stories can be worked on in parallel by different developers once Phase 2 is complete (except for linear dependencies noted above)

---

## Parallel Example: User Story 1

```bash
# Launch both backend tasks together:
Task: "Add route POST /api/user/borrowed/generate-return-pin"
Task: "Add generateReturnPin controller"

# Launch both frontend tasks together:
Task: "Add Generate Return PIN button to borrowed book card"
Task: "Integrate PIN display UI"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 4+5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — Generate Return PIN
4. Complete Phase 4: US2 — Librarian PIN Verification
5. Complete Phase 6: US4+5 — Return Confirmation (skip US3 condition assessment UI, use minimal condition select)
6. **STOP and VALIDATE**: Core return flow works (generate PIN → verify → confirm)
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → User can generate PIN → Deploy/Demo
3. US2 → Librarian can verify PIN → Deploy/Demo
4. US3 → Full condition assessment UI
5. US4+US5 → Penalty calculation + persistence → Deploy/Demo (MVP complete!)
6. US6 → Borrowing history → Deploy/Demo
7. US7 → Payment management → Deploy/Demo

### Full Delivery

1. Complete all user stories in priority order
2. Final polish (Phase 9)
3. Run quickstart validation scenarios
4. Verify backward compatibility

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Phase 2 must be fully complete before any user story can begin
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included (not requested in spec) — add via `/speckit.checklist` if needed
