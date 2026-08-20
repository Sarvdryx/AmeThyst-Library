# Tasks: Librarian PIN Verification & Book Borrowing Workflow

**Input**: Design documents from `specs/024-pin-veri-borrow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `server/src/`, `server/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — no setup needed since we're extending an existing Express.js backend codebase

- [x] T001 Verify the current state of existing library files: `server/src/routes/library.mjs`, `server/src/controllers/library.controller.mjs`, `server/src/services/library.services.mjs` — ensure all current imports and exports are understood before modification

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database query functions that MUST exist before any user story can use them.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Add `findBorrowRecordByPin` query function in `server/src/services/library.services.mjs` — looks up a borrow record by `pin` where `expired_at > NOW()`, JOINs with `users` and `books` tables to return borrower details (username, gender, phone, email) and book details (title, author, publisher, genre, price). Returns null if PIN not found or expired.
- [x] T003 [P] Add `checkUserEligibility` query function in `server/src/services/library.services.mjs` — checks if a user has any overdue borrows (`status='borrowed' AND due_date < NOW()`) or is suspended (`status='suspended'`). Returns `{ eligible: bool, reason: string }`.
- [x] T004 [P] Add `insertCalendarEvent` query function in `server/src/services/library.services.mjs` — inserts a row into the `calendar_events` table with `user_id`, `title`, `event_date`, `event_type='borrow_due'`, and `borrow_id`.

**Checkpoint**: Foundation ready — all three user stories can now be implemented

---

## Phase 3: User Story 1 - Verify PIN and Branch (Priority: P1) 🎯 MVP

**Goal**: Add a POST `/api/library/verify-pin` endpoint. Given a 6-digit PIN, looks it up, verifies it hasn't expired, checks the librarian's branch matches the borrow record's branch, and returns borrower + book details.

**Independent Test**: Call `POST /api/library/verify-pin` with a valid PIN from the librarian's branch → 200 with borrower/book details. Call with non-existent PIN → 404 "The PIN has expired or does not exist." Call with valid PIN from different branch → 403 "You have arrived at the wrong book borrowing branch."

### Implementation for User Story 1

- [x] T005 [US1] Implement `verifyPin` service function in `server/src/services/library.services.mjs` — calls `findBorrowRecordByPin`, checks `branch_id` against `req.user.branchId`, returns borrow record data. Throws typed errors for PIN not found (404) and branch mismatch (403).
- [x] T006 [US1] Implement `verifyPin` controller function in `server/src/controllers/library.controller.mjs` — extracts `pin` from `req.body`, gets librarian's `branchId` from `req.user`, calls `verifyPin` service, wraps in try/catch with `{ success, data, message }` JSON response format.
- [x] T007 [US1] Add `POST /api/library/verify-pin` route in `server/src/routes/library.mjs` — imports `verifyPin` from controller, applies `verifyToken` and `authorizeRole('librarian')` middlewares.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Confirm Book Loan (Priority: P1)

**Goal**: Add a POST `/api/library/confirm-loan` endpoint. After PIN verification, confirms the loan: updates status to `borrowed`, sets `due_date` to +14 days, creates a calendar event, and nullifies `expired_reserve`. All mutations wrapped in a DB transaction. Checks borrower eligibility first.

**Independent Test**: Call `POST /api/library/confirm-loan` with a valid `borrow_id` for an eligible user → 200 with `status='borrowed'` and `due_date = today + 14 days`. Verify `calendar_events` table has new entry. Call with ineligible user → 409 "Borrower has overdue books or is suspended."

### Implementation for User Story 2

- [x] T008 [P] [US2] Add `updateBorrowStatusToBorrowed` query function in `server/src/services/library.services.mjs` — updates `status='borrowed'`, `due_date = NOW() + INTERVAL '14 days'`, `expired_reserve = NULL` for the given `borrow_id`.
- [x] T009 [P] [US2] Add `incrementBookQuantity` query function in `server/src/services/library.services.mjs` — increments `quantity` by 1 for the book at the given branch (used by cancellation, but added here as shared utility).
- [x] T010 [US2] Implement `confirmLoan` service function in `server/src/services/library.services.mjs` — calls `checkUserEligibility` first; if eligible, wraps `updateBorrowStatusToBorrowed` + `insertCalendarEvent` in a `BEGIN`/`COMMIT`/`ROLLBACK` transaction block. Throws 409 if ineligible.
- [x] T011 [US2] Implement `confirmLoan` controller function in `server/src/controllers/library.controller.mjs` — extracts `borrow_id` from `req.body`, calls `confirmLoan` service, returns `{ success, data, message }`.
- [x] T012 [US2] Add `POST /api/library/confirm-loan` route in `server/src/routes/library.mjs` — imports `confirmLoan` from controller, applies `verifyToken` and `authorizeRole('librarian')` middlewares.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Cancel Book Loan (Priority: P1)

**Goal**: Add a POST `/api/library/cancel-loan` endpoint. Deletes the borrow record and increments the book's quantity by 1 for the branch. All mutations wrapped in a DB transaction.

**Independent Test**: Call `POST /api/library/cancel-loan` with a valid `borrow_id` → 200. Verify the row is deleted from `borrow_book`. Verify the book's `quantity` field is incremented by 1. Call with invalid `borrow_id` → 404.

### Implementation for User Story 3

- [x] T013 [P] [US3] Add `deleteBorrowRecord` query function in `server/src/services/library.services.mjs` — deletes the borrow record for the given `borrow_id`, returning the `book_id` and `branch_id` for quantity update.
- [x] T014 [US3] Implement `cancelLoan` service function in `server/src/services/library.services.mjs` — wraps `deleteBorrowRecord` + `incrementBookQuantity` in a `BEGIN`/`COMMIT`/`ROLLBACK` transaction block. If borrow record not found, throws 404.
- [x] T015 [US3] Implement `cancelLoan` controller function in `server/src/controllers/library.controller.mjs` — extracts `borrow_id` from `req.body`, calls `cancelLoan` service, returns `{ success, data, message }`.
- [x] T016 [US3] Add `POST /api/library/cancel-loan` route in `server/src/routes/library.mjs` — imports `cancelLoan` from controller, applies `verifyToken` and `authorizeRole('librarian')` middlewares.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and quality assurance

- [ ] T017 [P] Run `quickstart.md` validation scenarios against the running backend to verify all three endpoints work end-to-end (requires running server + database)
- [x] T018 Verify all error responses use the consistent `{ success: false, data: null, message: "..." }` JSON format
- [x] T019 Update the `AGENTS.md` SPECKIT reference to point to this feature's `plan.md` if not already updated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — no dependency on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational — reuses `findBorrowRecordByPin` from US1's context but is independently implementable
- **User Story 3 (Phase 5)**: Depends on Foundational — independently implementable
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — independently testable

### Within Each User Story

- Query/service functions before controller functions
- Controllers before routes
- Story complete before moving to next priority

### Parallel Opportunities

- All Phase 2 Foundational tasks (T002, T003, T004) can run in parallel
- Within US2: T008 and T009 can run in parallel
- Within each story, service + controller can run sequentially after queries are done
- US1, US2, and US3 can technically be developed in parallel after Phase 2 completes

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all three query functions together:
Task: "Add findBorrowRecordByPin query in server/src/services/library.services.mjs"
Task: "Add checkUserEligibility query in server/src/services/library.services.mjs"
Task: "Add insertCalendarEvent query in server/src/services/library.services.mjs"
```

## Parallel Example: User Story 2

```bash
# Launch query functions in parallel:
Task: "Add updateBorrowStatusToBorrowed query in server/src/services/library.services.mjs"
Task: "Add incrementBookQuantity query in server/src/services/library.services.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Verify PIN)
4. **STOP and VALIDATE**: Test `POST /api/library/verify-pin` independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Verify PIN) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Confirm Loan) → Test independently → Deploy/Demo
4. Add User Story 3 (Cancel Loan) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Verify PIN)
   - Developer B: User Story 2 (Confirm Loan)
   - Developer C: User Story 3 (Cancel Loan)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Follow existing code patterns: named async functions, `try/catch` blocks, `pool.query()` with parameterized SQL
- All responses must use the `{ success: bool, data: object|null, message: string }` format
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
