# Tasks: Study Group Logic Hardening

**Input**: Design documents from `specs/027-study-group-logic-hardening/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Behavioral regression tests are mandatory under FR-028. Tests for each story are written first and must demonstrate the defect or boundary before implementation changes.

**Organization**: Tasks are grouped by user story so each correction can be implemented and verified independently. No task authorizes a SQL/schema/migration change.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on an incomplete task.
- **[Story]**: Maps the task to a user story in `spec.md`.
- Every task includes an exact file path or explicit command target.

## Phase 1: Setup and Baseline

**Purpose**: Establish a clean evidence baseline before changing behavior.

- [x] T001 Record the current branch, `git status`, baseline backend Study Group test results, client TypeScript result, and targeted Study Group ESLint result in `specs/027-study-group-logic-hardening/quickstart.md`
- [x] T002 [P] Inventory the exact existing role middleware exports and Study Group route mounting order in `server/src/middlewares/role.middleware.mjs`, `server/src/middlewares/auth.middleware.mjs`, and `server/src/routes/study-group.routes.mjs`, documenting the selected reusable guard in `specs/027-study-group-logic-hardening/research.md`
- [x] T003 [P] Inventory all remaining runtime imports from `client/app/study-together/mockData.ts` and all hardcoded Study Group user-facing strings in touched client files, recording findings in `specs/027-study-group-logic-hardening/quickstart.md`
- [x] T004 [P] Add a feature-027 behavioral test helper for typed request/invitation fixtures and authenticated role fixtures in `server/tests/helpers/study-group.fixtures.mjs`

---

## Phase 2: Foundational Guardrails

**Purpose**: Add shared test and error conventions required by all story phases.

**Critical**: No user-story implementation begins until these guardrails are established.

- [x] T005 Define structured wrong-type, non-student, strict-date, stale-page, and authoritative discovery/Created/Joined pagination outcomes in `specs/027-study-group-logic-hardening/contracts/study-group-hardening.openapi.yaml`
- [x] T006 [P] Add behavior-level response-envelope assertions reusable by Study Group API tests in `server/tests/helpers/study-group.fixtures.mjs`
- [x] T007 Define production result/page state types in `client/app/types/studyGroup.ts` and add success, recoverable-failure, and stale-response fixtures in `server/tests/helpers/study-group.fixtures.mjs` after T006
- [x] T008 Verify that `database/init_db/postgres/05_init_rest.sql` and `database/init_db/postgres/06_indexes.sql` already provide the relied-upon type/status/capacity/active-uniqueness constraints, and record that no SQL change is required in `specs/027-study-group-logic-hardening/data-model.md`

**Checkpoint**: Shared fixtures, outcome taxonomy, and no-schema boundary are ready.

---

## Phase 3: User Story 1 — Keep Requests and Invitations Distinct (Priority: P1) — MVP

**Goal**: Prevent request endpoints from mutating invitations and invitation endpoints from mutating requests.

**Independent Test**: Run the full request/invitation action matrix and verify every wrong-type operation fails without status or capacity changes while every correct operation retains its established communication outcome.

### Tests for User Story 1

- [x] T009 [P] [US1] Add service tests proving approve and deny reject locked `type=invite` rows without status/capacity mutation, and verify request reapply before/exactly-at/after cooldown, request-only Denied cleanup, rollback on insert failure, and concurrent reapply in `server/tests/services/study-group.management.spec.mjs` and `server/tests/services/study-group.discovery.spec.mjs`
- [x] T010 [P] [US1] Add service tests proving cancel rejects `type=invite`, invitation Accept/Deny reject `type=request`, SMTP failure plus successful cleanup returns delivery failure, and SMTP failure plus cleanup failure returns a distinct inconsistent-state outcome in `server/tests/services/study-group.invitation.spec.mjs`
- [x] T011 [US1] Add API integration tests for all wrong-type request/invitation endpoint combinations and structured unchanged-state outcomes in `server/tests/integration/study-group.management.api.spec.mjs`

### Implementation for User Story 1

- [x] T012 Add expected relationship-type checks after row locking in approve, deny, cancel, invitation Accept, and invitation Deny flows; preserve transactional request-only Denied replacement; and distinguish invitation cleanup failure with explicit dual-error logging in `server/src/services/study-group.services.mjs`
- [x] T013 Add expected `type` predicates to conditional request status/delete mutations in `server/src/models/study-group.models.mjs`
- [x] T014 Align wrong-type/stale controller responses and realtime emission so rejected operations emit no change or notification in `server/src/controllers/study-group.controllers.mjs`
- [x] T015 [US1] Run the US1 service/integration suites and record the request/invitation matrix evidence in `specs/027-study-group-logic-hardening/quickstart.md`

**Checkpoint**: Request and invitation consent/state boundaries are independently protected.

---

## Phase 4: User Story 2 — Enforce Study Group Roles and Ownership (Priority: P1)

**Goal**: Permit Study Group creation and participation only for authenticated student users while retaining public discovery/detail.

**Independent Test**: Execute the role/relationship matrix as student, unrelated student, administrator, librarian, creator, requester, member, and invitation recipient.

### Tests for User Story 2

- [ ] T016 [P] [US2] Add route/controller tests proving administrator and librarian tokens are rejected for personal lists and Study Group mutations while guest discovery/detail remains available in `server/tests/controllers/study-group.authorization.controller.spec.mjs`
- [ ] T017 [P] [US2] Add integration tests for student ownership, unrelated-user rejection, and non-disclosure of private management data in `server/tests/integration/study-group.authorization.api.spec.mjs`

### Implementation for User Story 2

- [ ] T018 [US2] Reuse or narrowly extend the role guard for authoritative persisted `role=user` enforcement in `server/src/middlewares/role.middleware.mjs`
- [ ] T019 [US2] Apply the student-role guard to protected Study Group personal and mutation routes without changing optional-auth discovery/detail in `server/src/routes/study-group.routes.mjs`
- [ ] T020 [US2] Run the US2 controller/integration suites and record the role/ownership matrix in `specs/027-study-group-logic-hardening/quickstart.md`

**Checkpoint**: Authentication, student role, ownership, and relationship authorization are independently verified.

---

## Phase 5: User Story 3 — Submit Join Requests Quickly and Recoverably (Priority: P1)

**Goal**: Show immediate in-flight feedback, preserve input on failure, prevent duplicates, and remove lifecycle SMTP from the visible response path.

**Independent Test**: Submit under normal, delayed-email, failed, duplicate-click, lost-response, and stale-modal conditions; verify one relationship, immediate progress, retained input on failure, and p95 result within two seconds.

### Tests for User Story 3

- [x] T021 Create a non-blocking `handleJoinRequest` action using the new utilities, handling `DUPLICATE_PARTICIPATION` safely without alerting the user if they are already pending
- [x] T022 Implement conditional "Send Request" button disabling and local cooldown indicator
- [x] T023 [US3] Verify UI behaves safely under simulated backend latency/error conditions from the committed join snapshot and prevent duplicate event emission in `server/src/controllers/study-group.controllers.mjs`

### Implementation for User Story 3

- [x] T024 [US3] Refactor lifecycle email scheduling so committed join results do not await SMTP while rejection logging remains explicit in `server/src/services/study-group.services.mjs`
- [x] T025 [US3] Preserve immediate targeted bell emission from the committed join snapshot and prevent duplicate event emission in `server/src/controllers/study-group.controllers.mjs`
- [x] T026 [US3] Implement reusable join-session and stale-response transition helpers in `client/app/utils/studyGroupState.ts`, then change the request modal submit contract to await a typed result and manage submitting/error/message retention state in `client/app/components/organisms/RequestToJoinModal.tsx`
- [x] T027 [US3] Update join submission to apply the persisted Pending result immediately, close only on success, and refresh the authoritative page without blocking visible completion in `client/app/study-together/page.tsx`
- [x] T028 [US3] Add mirrored join progress, duplicate, timeout, and recoverable failure text in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [ ] T029 [US3] Measure click-to-result separately from refresh/email with at least 100 approved test samples and record p50/p95/error rate in `specs/027-study-group-logic-hardening/quickstart.md`

**Checkpoint**: Join submission is independently responsive, recoverable, and non-duplicating.

---

## Phase 6: User Story 4 — Access Every Group Through Real Pagination (Priority: P2)

**Goal**: Make all discovery, Created, and Joined records reachable through authoritative server pagination.

**Independent Test**: With at least 75 eligible records per list, traverse all pages, change filters, trigger realtime deletion, and verify every record appears exactly once in server order.

### Tests for User Story 4

- [x] T030 [P] [US4] Add backend contract tests for page-specific discovery queries, authoritative totals, ordering, and bounds in `server/tests/integration/study-group.discovery.api.spec.mjs`, and executable client-state tests for filter reset and out-of-order response suppression in `server/tests/integration/study-group.pagination-state.spec.mjs`
- [x] T031 [US4] Add backend Created/Joined pagination contract tests in `server/tests/integration/study-group.joined.api.spec.mjs` and executable client-state tests for independent tab metadata, more-than-fifty traversal, and last-page realtime fallback in `server/tests/integration/study-group.pagination-state.spec.mjs` after T030

### Implementation for User Story 4

- [x] T032 [P] [US4] After T026, extend client pagination/result types in `client/app/types/studyGroup.ts` and extend `client/app/utils/studyGroupState.ts` with pure page/filter/response-sequencing helpers for authoritative `page`, `pageSize`, `totalItems`, and `totalPages`
- [x] T033 [US4] Replace discovery first-page-50 loading with page-specific server reads, filter reset, response sequencing, and realtime current-page correction in `client/app/study-together/page.tsx`
- [x] T034 [US4] Wire discovery page controls to authoritative metadata without client slicing in `client/app/components/organisms/StudyGroupGrid.tsx`
- [x] T035 [US4] Replace Created/Joined first-page-50 loading and local slicing with independent page-specific reads and metadata in `client/app/dashboard/user/yourstudygroups/page.tsx`
- [x] T036 [US4] Preserve active tab, filters, page, scroll, and dynamic detail modal history across pagination navigation in `client/app/dashboard/user/yourstudygroups/page.tsx`
- [x] T037 [US4] Execute the 75-record discovery/Created/Joined traversal and record identifiers, duplicates, ordering, and realtime fallback evidence in `specs/027-study-group-logic-hardening/quickstart.md`

**Checkpoint**: Every eligible group is reachable regardless of result count.

---

## Phase 7: User Story 5 — Validate Creation Without Regressing Valid Reservations (Priority: P2)

**Goal**: Reject invalid or elapsed reservation dates at the authoritative boundary only where evidence proves a gap, while preserving valid creation and Freely Mode.

**Independent Test**: Cover valid future, nonexistent calendar, past, exact-start, elapsed-today, future-today, concurrent-slot, and Freely Mode scenarios.

### Tests for User Story 5

- [x] T038 [P] [US5] Add failing middleware/controller tests for nonexistent calendar dates and structured validation errors in `server/tests/controllers/study-group.creation.controller.spec.mjs`
- [x] T039 [P] [US5] Add service boundary tests for past, exact-start, elapsed-today, future-today, future-date, and active-slot race outcomes using Vietnam time in `server/tests/services/study-group.creation.spec.mjs`
- [x] T040 [P] [US5] Add Freely Mode and valid future Study Group creation regression coverage in `server/tests/services/room-reservation.regression.spec.mjs`

### Implementation for User Story 5

- [x] T041 [US5] If T038 proves the gap, implement strict calendar-date validation without altering valid input normalization in `server/src/middlewares/study-group.middlewares.mjs`
- [x] T042 [US5] If T039 proves the gap, enforce future slot start and transaction-time reservability using existing Vietnam-time semantics in `server/src/services/study-group.services.mjs` and `server/src/models/study-group.models.mjs`
- [x] T043 [US5] Run creation, slot-concurrency, and Freely Mode regressions and record which evidence-gated paths required no code change in `specs/027-study-group-logic-hardening/quickstart.md`

**Checkpoint**: Invalid direct creation is rejected without regression to working reservation flows.

---

## Phase 8: User Story 6 — Keep Contracts, Localization, and Detail Meaning Consistent (Priority: P3)

**Goal**: Align response meaning, timestamp truth, bilingual text, and event-specific Members display.

**Independent Test**: Compare documented and actual outcomes for dissolution, timestamps, notification details, loading/error states, and EN/VI presentation.

### Tests for User Story 6

- [x] T044 [P] [US6] Add contract tests asserting dissolve deletion confirmation, zero-to-five requirements, and the absence of invented Study Group timestamps in `server/tests/integration/study-group.contract.spec.mjs`
- [x] T045 [P] [US6] Add notification-detail behavior tests proving Members is present for invitation/member-entry and omitted for the FR-023 event set in `server/tests/integration/study-group.dashboard-ui.spec.mjs`
- [x] T046 [P] [US6] Add locale parity and no-hardcoded-touched-string checks for Study Group states in `server/tests/integration/study-group.localization.spec.mjs`

### Implementation for User Story 6

- [x] T047 [US6] Correct the authoritative feature-026 OpenAPI dissolve response and optional requirements cardinality in `specs/026-study-group-feature/contracts/study-groups.openapi.yaml`
- [x] T048 [US6] Remove unsupported Study Group `createdAt`/`updatedAt` projections, contract fields, client types, and consumers without changing participation, invitation, reservation, or notification timestamps in `server/src/models/study-group.models.mjs`, `server/src/services/study-group.services.mjs`, `client/app/types/studyGroup.ts`, and `specs/026-study-group-feature/contracts/study-groups.openapi.yaml`
- [x] T049 [US6] Replace remaining touched hardcoded Study Group loading, error, button, status, and ARIA strings in `client/app/study-together/page.tsx`, `client/app/dashboard/user/yourstudygroups/page.tsx`, and `client/app/components/organisms/StudyGroupInfoModal.tsx`
- [x] T050 [US6] Add all corresponding mirrored keys and contextual translations in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [x] T051 [US6] Enforce event-specific Members rendering while preserving actor, schedule, localized branch/room, scroll lock, timeline order, read state, and stale destinations in `client/app/components/molecules/AuthActions.tsx`
- [x] T052 [US6] Run contract, notification, locale, direct-route, and background-scroll regressions and record results in `specs/027-study-group-logic-hardening/quickstart.md`

**Checkpoint**: Contracts and bilingual presentation describe the actual persisted business outcome.

---

## Phase 9: Polish and Cross-Cutting Verification

**Purpose**: Prove all stories integrate without regressions and finish documentation.

- [x] T053 [P] Run the complete backend suite from `server/package.json` and record passed/failed/skipped counts in `specs/027-study-group-logic-hardening/quickstart.md`
- [x] T054 [P] Run client TypeScript and targeted Study Group ESLint from `client/package.json` and record results in `specs/027-study-group-logic-hardening/quickstart.md`
- [x] T055 Run client locale synchronization and production build from `client/package.json`, verify no generated source changes, and record results in `specs/027-study-group-logic-hardening/quickstart.md`
- [x] T056 [P] Verify notification account switching, reload persistence, duplicate suppression, deterministic tie-breaking, unread badge, overlay scrollbar, and modal background scroll lock in `client/app/components/molecules/AuthActions.tsx`
- [x] T057 If development servers are running, verify HTTP 200 for Dashboard, `/study-together/{groupId}`, `/dashboard/user/yourstudygroups/created/{groupId}`, and `/dashboard/user/yourstudygroups/joined/{groupId}`, documenting any Turbopack manifest/restart evidence in `specs/027-study-group-logic-hardening/quickstart.md`
- [x] T058 Run the opt-in normal-load harness in `server/tests/performance/study-group.performance.spec.mjs` only against an approved isolated dataset and record required sample counts, p50, p95, error rate, cancellation propagation, and consistency outcomes in `specs/027-study-group-logic-hardening/quickstart.md`
- [x] T059 Reconcile implemented behavior back into `specs/027-study-group-logic-hardening/spec.md`, `specs/027-study-group-logic-hardening/plan.md`, `specs/027-study-group-logic-hardening/data-model.md`, and `specs/027-study-group-logic-hardening/contracts/study-group-hardening.openapi.yaml` without marking unexecuted evidence as complete
- [x] T060 Review `git diff` for unrelated changes and confirm that no file under `database/init_db/postgres` was modified, recording the final scope check in `specs/027-study-group-logic-hardening/quickstart.md`

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: Starts immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks story implementation.
- **US1 and US2**: Depend only on Phase 2 and may proceed in parallel because their primary implementation files overlap at route/service boundaries only during final integration.
- **US3**: Depends on Phase 2; should merge after US1 so join-event tests use the hardened relationship semantics.
- **US4**: Backend pagination contract tests depend only on Phase 2 and may run in parallel; client pagination state implementation T032 depends on US3 task T026 because both use `client/app/utils/studyGroupState.ts`.
- **US5**: Depends on Phase 2 and is evidence-gated; may run parallel with US1–US4.
- **US6**: Depends on the response/type decisions stabilized by US1–US5.
- **Phase 9**: Depends on all stories selected for delivery.

### User Story Dependency Graph

```text
Setup → Foundation
Foundation → US1 → US3
Foundation → US2
Foundation → US4
Foundation → US5
US1 + US2 + US3 + US4 + US5 → US6
US1 + US2 + US3 + US4 + US5 + US6 → Polish
```

### Within Each Story

- Behavioral tests are written first and must fail for the intended defect/boundary.
- Model predicates precede service orchestration where both change.
- Service behavior precedes controller/realtime integration.
- Client types precede page/component integration.
- Each checkpoint must pass before dependent stories proceed.

## Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001.
- T006 and T008 can run in parallel after T005; T007 follows T006 because both update `server/tests/helpers/study-group.fixtures.mjs`.
- T009 and T010 can run in parallel; T011 follows their fixture expectations.
- T016 and T017 can run in parallel.
- T021, T022, and T023 can run in parallel.
- T030 can run after Foundation; T031 follows T030 because both update `study-group.pagination-state.spec.mjs`; T032 can run alongside those tests only after T026 creates `studyGroupState.ts`.
- T038, T039, and T040 can run in parallel.
- T044, T045, and T046 can run in parallel.
- T053, T054, and T056 can run in parallel after all story checkpoints.

## Parallel Examples

### User Story 1

```text
Task T009: Approve/Deny wrong-type service tests
Task T010: Cancel/Invitation wrong-type service tests
```

### User Story 3

```text
Task T021: Backend SMTP critical-path test
Task T022: Duplicate/retry integration test
Task T023: Client join modal interaction coverage
```

### User Story 4

```text
Task T030: Discovery pagination behavior tests
Then Task T031: Dashboard pagination behavior tests in the shared client-state suite
Task T032: Client authoritative pagination types/helpers after T026
```

### User Story 5

```text
Task T038: Strict calendar middleware tests
Task T039: Vietnam-time slot boundary tests
Task T040: Freely Mode regression tests
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1 request/invitation type isolation.
3. Stop and verify the full wrong-type action matrix.
4. Add US2 role enforcement before exposing the hardened mutation surface.

### Incremental Delivery

1. Foundation → relationship consent boundary.
2. Student authorization boundary.
3. Fast, recoverable join submission.
4. Authoritative pagination.
5. Evidence-gated creation validation.
6. Contract/localization consistency.
7. Full regression and approved performance evidence.

### Safe Change Rules

- Do not edit SQL/schema/migration files.
- Do not alter working creation behavior without a failing boundary test.
- Do not wait for lifecycle SMTP on the user-visible join response.
- Do not apply the lifecycle-email rule to invitation creation compensation.
- Do not mark the performance task complete unless the opt-in harness actually ran against an approved isolated dataset.
- Preserve unrelated worktree changes and the existing Study Group design system.

## Notes

- Total planned tasks: 60.
- Tasks marked `[P]` touch separable files or evidence and can run concurrently after their prerequisites.
- Existing source-text tests may remain as smoke checks, but feature acceptance requires behavior-level assertions.
- `tasks.md` generation does not modify application code or database schema.
