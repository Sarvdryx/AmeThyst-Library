# Tasks: Reserve Book

**Input**: Design documents from `/specs/013-reserve-book/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/

**Tests**: No test tasks included (manual testing only per quickstart.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify existing database schema has borrow_book table with required columns (status, expired_at, pin) in `database/init_db/postgres/04_init_rest.sql`
- [x] T002 [P] Create database indexes for reservation queries in `database/init_db/postgres/05_indexes.sql`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Verify auth middleware exists and works in `server/src/middlewares/auth.middleware.mjs`
- [x] T004 [P] Verify library routes structure exists in `server/src/routes/library.mjs`
- [x] T005 [P] Verify library controller structure exists in `server/src/controllers/library.controller.mjs`
- [x] T006 [P] Verify library services structure exists in `server/src/services/library.services.mjs`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reserve Available Book (Priority: P1) 🎯 MVP

**Goal**: Allow authenticated users to reserve available books at specific branches

**Independent Test**: Login → Navigate to book with availability → Select branch → Click Reserve → Verify success message and updated availability

### Implementation for User Story 1

- [x] T007 [US1] Add branchId parameter to POST /api/library/reserve endpoint in `server/src/routes/library.mjs`
- [x] T008 [US1] Add verifyToken middleware to POST /api/library/reserve route in `server/src/routes/library.mjs`
- [x] T009 [US1] Update reserveBook controller to extract userId from req.user and accept branchId in `server/src/controllers/library.controller.mjs`
- [x] T010 [US1] Rewrite createReservation service to insert into borrow_book table with proper validation in `server/src/services/library.services.mjs`
- [x] T011 [US1] Implement SELECT ... FOR UPDATE row locking for concurrent reservation handling in `server/src/services/library.services.mjs`
- [x] T012 [US1] Add duplicate reservation check (user cannot have multiple active reservations for same book) in `server/src/services/library.services.mjs`
- [x] T013 [US1] Generate 6-digit pickup PIN for reservation in `server/src/services/library.services.mjs`
- [x] T014 [US1] Set expired_at timestamp (48 hours from reservation) in `server/src/services/library.services.mjs`
- [x] T015 [US1] Return proper error responses (BOOK_UNAVAILABLE, ALREADY_RESERVED, UNAUTHORIZED) in `server/src/services/library.services.mjs`
- [x] T016 [US1] Add branch selection state management to book detail page in `client/app/library/[id]/page.tsx`
- [x] T017 [US1] Update handleReserve function to send JWT token and branchId in `client/app/library/[id]/page.tsx`
- [x] T018 [US1] Add loading and error states for reservation process in `client/app/library/[id]/page.tsx`
- [x] T019 [US1] Create BranchSelector molecule component in `client/app/components/molecules/BranchSelector.tsx`
- [x] T020 [US1] Integrate BranchSelector into BookDetailTemplate with clickable branch cards in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T021 [US1] Update reserve button to show selected branch name and disabled state when no branch selected in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T022 [US1] Add reservation success confirmation UI with PIN display in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T023 [US1] Re-fetch book details after successful reservation to update availability in `client/app/library/[id]/page.tsx`
- [x] T024 [US1] Add i18n keys for reservation flow in `client/app/locales/en.json` and `client/app/locales/vi.json`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - View Reservation Status (Priority: P2)

**Goal**: Display real-time availability counts for each branch on book detail page

**Independent Test**: Navigate to any book detail page → Verify branch availability information is displayed with color coding

### Implementation for User Story 2

- [x] T025 [US2] Update getBookById service to include branchId in inventory array response in `server/src/services/library.services.mjs`
- [x] T026 [US2] Add userReservation field to book details response (if user is authenticated) in `server/src/services/library.services.mjs`
- [x] T027 [US2] Update BookDetails TypeScript interface to include branchId and userReservation in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T028 [US2] Add color coding for availability (green for >0, red for 0) in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T029 [US2] Display shelf location for each branch in availability grid in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T030 [US2] Show "Reserved" state with PIN if user has active reservation in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T031 [US2] Add i18n keys for availability display in `client/app/locales/en.json` and `client/app/locales/vi.json`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Handle Unavailable Books (Priority: P3)

**Goal**: Gracefully handle books with zero availability across all branches

**Independent Test**: Navigate to book with 0 availability → Verify reserve button is disabled with tooltip

### Implementation for User Story 3

- [x] T032 [US3] Add disabled state for reserve button when no branches have availability in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T033 [US3] Add tooltip explaining unavailability when reserve button is disabled in `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T034 [US3] Handle network errors during reservation with user-friendly message in `client/app/library/[id]/page.tsx`
- [x] T035 [US3] Add i18n keys for unavailable states and error messages in `client/app/locales/en.json` and `client/app/locales/vi.json`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T036 [P] Add reservation logging for audit trail in `server/src/services/library.services.mjs`
- [x] T037 [P] Add cancel reservation endpoint (DELETE /api/library/reserve/:reservationId) in `server/src/routes/library.mjs` and `server/src/controllers/library.controller.mjs`
- [x] T038 [P] Add get user reservations endpoint (GET /api/library/reservations) in `server/src/routes/library.mjs` and `server/src/controllers/library.controller.mjs`
- [x] T039 Verify mobile responsiveness of BranchSelector and availability grid in `client/app/components/molecules/BranchSelector.tsx` and `client/app/components/templates/BookDetailTemplate.tsx`
- [x] T040 Run quickstart.md validation scenarios to verify end-to-end functionality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) should be implemented first as it's the MVP
  - User Story 2 (P2) can be implemented in parallel with US1 or after
  - User Story 3 (P3) can be implemented in parallel with US1/US2 or after
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Backend tasks before frontend tasks (API must exist before UI can call it)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all backend tasks for User Story 1 together:
Task: "Add branchId parameter to POST /api/library/reserve endpoint in server/src/routes/library.mjs"
Task: "Add verifyToken middleware to POST /api/library/reserve route in server/src/routes/library.mjs"
Task: "Update reserveBook controller to extract userId from req.user and accept branchId in server/src/controllers/library.controller.mjs"

# Launch all frontend tasks for User Story 1 together:
Task: "Add branch selection state management to book detail page in client/app/library/[id]/page.tsx"
Task: "Create BranchSelector molecule component in client/app/components/molecules/BranchSelector.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md scenarios
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Backend + Frontend)
   - Developer B: User Story 2 (Backend + Frontend)
   - Developer C: User Story 3 (Backend + Frontend)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence