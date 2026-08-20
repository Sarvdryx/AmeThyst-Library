# Tasks: Reservation-Backed Study Groups

**Input**: Design documents from `/specs/026-study-group-feature/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/study-groups.openapi.yaml](./contracts/study-groups.openapi.yaml), [quickstart.md](./quickstart.md)

**Tests**: Test tasks are included because the plan explicitly requires backend model/service/controller/integration, concurrency, rollback, contract, and Freely Mode regression verification. Write each story’s tests first and confirm they fail for the expected missing behavior before implementation.

**Organization**: Tasks are grouped by user story. P2 stories are ordered by their dependencies and product flow; US6 retains its original story identifier even though its P2 phase precedes P3 US5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it targets a different file and has no dependency on another incomplete task in the same group.
- **[Story]**: Maps the task to a user story from `spec.md`.
- Every task includes an exact repository-relative file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish Study Group module boundaries and shared client contracts without changing runtime behavior.

- [X] T001 Create the layered Study Group backend module skeleton and exported placeholders in `server/src/models/study-group.models.mjs`, `server/src/services/study-group.services.mjs`, `server/src/controllers/study-group.controllers.mjs`, and `server/src/routes/study-group.routes.mjs`
- [X] T002 [P] Define API DTO, lifecycle status, participation status, permission, pagination, and view-model types independent of mock data in `client/app/types/studyGroup.ts`
- [X] T003 [P] Create typed Study Group transport function signatures and DTO-to-view adapter placeholders using `apiFetch` in `client/app/utils/studyGroup.ts`
- [X] T004 [P] Add reusable Study Group test builders for users, rooms, slots, reservations, groups, and requests in `server/tests/helpers/study-group.fixtures.mjs`

**Checkpoint**: Backend layers, client types, client API boundary, and test fixtures exist without altering Freely Mode or current pages.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Align authoritative schema and establish shared lifecycle, transaction, authorization, projection, and routing behavior required by every story.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T005 Verify `reserve_room.status` remains limited to `pending`, `reserved`, and `used`; align required PK/FK/unique constraints and decision timestamps with the authoritative schema without adding a Cancelled reservation status
- [X] T006 Add active-slot uniqueness, active-participation uniqueness, host/status, participant/status, cooldown lookup, and reservation history indexes in `database/init_db/postgres/06_indexes.sql`
- [X] T007 [P] Add schema-invariant tests for relationship constraints, one-group-per-reservation, active slot uniqueness, active participation uniqueness, deletion-based slot reuse, request type, and decision timestamps in `server/tests/models/study-group.schema.spec.mjs`
- [X] T008 Implement shared SQL projection, pagination, transaction-client, row-lock, active-status, and lifecycle query primitives in `server/src/models/study-group.models.mjs`
- [X] T009 Implement metadata normalization, UUID/date/pagination validation, role/ownership authorization, effective lifecycle calculation, status ordering, cooldown calculation, and PostgreSQL conflict mapping in `server/src/services/study-group.services.mjs`
- [X] T010 Align room-reservation cancellation with permanent deletion and centralize active reservation predicates in `server/src/models/room.models.mjs` and `server/src/services/room.services.mjs`
- [X] T011 [P] Add regression tests proving cancelled reservations are permanently deleted/non-blocking and Freely Mode availability/conflict behavior remains unchanged in `server/tests/services/room-reservation.regression.spec.mjs`
- [X] T012 Implement reusable body, path, and query validation/sanitization middleware for UUIDs, required metadata, trimmed zero-to-five optional requirements, title/subject letter content, pagination, filters, and unsupported values in `server/src/middlewares/study-group.middlewares.mjs`, and implement standard `{ success, data }`, structured error helpers, and canonical current-user handling in `server/src/controllers/study-group.controllers.mjs`
- [X] T013 Declare the OpenAPI operations and apply `verifyToken` or `optionalAuth` followed by operation-specific Study Group validation middleware in `server/src/routes/study-group.routes.mjs`
- [X] T014 Mount the Study Group router at `/api/study-groups` without altering existing room/dashboard mounts in `server/src/server.mjs`
- [X] T015 Complete typed API calls, query serialization, response normalization, centralized status labels/order, and DTO adapters in `client/app/utils/studyGroup.ts`

**Checkpoint**: Clean database initialization passes integrity tests; common backend/client infrastructure is ready and all existing Freely Mode server behavior still passes.

---

## Phase 3: User Story 1 — Create a Study Group with a Room Reservation (Priority: P1) 🎯 MVP

**Goal**: Enable authenticated students to select Study Group Mode and atomically create one reservation followed by exactly one linked group with validated metadata and room-derived capacity.

**Independent Test**: Select an available room/date/slot, enter valid group details, confirm, and verify one reservation and one linked group are committed; force the second insert to fail and verify neither record remains; repeat Freely Mode unchanged.

### Tests for User Story 1

- [X] T016 [P] [US1] Add service tests for field normalization, zero-to-five optional nonblank requirements, title/subject validation, room-derived capacity, host count, transaction rollback, and slot conflict mapping in `server/tests/services/study-group.creation.spec.mjs`
- [X] T017 [P] [US1] Add middleware/controller/contract tests for `POST /api/study-groups`, including malformed UUIDs, missing fields, metadata limits, trimmed requirements, unsupported values, authentication, response envelope, and error codes in `server/tests/controllers/study-group.creation.controller.spec.mjs`
- [X] T018 [P] [US1] Add Supertest integration tests for atomic creation, one group per reservation, concurrent same-slot attempts, and rollback on group insert failure in `server/tests/integration/study-group.creation.api.spec.mjs`

### Implementation for User Story 1

- [X] T019 [US1] Implement transaction-aware reservation-first and group-second insert/model reads with authoritative room capacity in `server/src/models/study-group.models.mjs`
- [X] T020 [US1] Implement atomic creation orchestration, normalization, authorization, capacity validation, rollback, and `23505` to `409 SLOT_UNAVAILABLE` mapping in `server/src/services/study-group.services.mjs`
- [X] T021 [US1] Implement the create controller and wire `POST /api/study-groups` in `server/src/controllers/study-group.controllers.mjs` and `server/src/routes/study-group.routes.mjs`
- [X] T022 [P] [US1] Add mirrored creation, validation, loading, rollback, error, and success strings under Study Group namespaces in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T023 [US1] Enable `studyGroup` mode while preserving existing room/date/slot selection state and Freely Mode behavior in `client/app/components/organisms/RoomDetailPanel.tsx`
- [X] T024 [US1] Add required title, description, and subject, dynamic zero-to-five optional requirement inputs, client validation, in-flight disablement, and atomic create submission in `client/app/components/organisms/RoomDetailPanel.tsx`
- [X] T025 [US1] Run the US1 creation/rollback/Freely regression scenario and record any corrected setup assumptions in `specs/026-study-group-feature/quickstart.md`

**Checkpoint**: US1 is a deployable MVP: Study Group reservation creation works atomically and Freely Mode is unchanged.

---

## Phase 4: User Story 2 — View and Edit Groups I Created (Priority: P2)

**Goal**: Replace created-group mock data with persisted, correctly ordered groups and allow valid Upcoming/Full metadata edits.

**Independent Test**: Seed all lifecycle statuses, verify Cancelled groups are omitted and the remaining order is In Progress → Full → Upcoming → Completed → Expired, edit an Upcoming/Full group, reload and confirm persistence, and verify historical groups are read-only and only Completed/Expired cards are dimmed.

### Tests for User Story 2

- [X] T026 [P] [US2] Add model/service tests for created-group status priority, scheduled-time tie-breaks, pagination, effective lifecycle reconciliation, host-only detail, and valid/read-only metadata edits in `server/tests/services/study-group.created.spec.mjs`
- [X] T027 [P] [US2] Add middleware/controller/contract tests for `GET /created`, `GET /{groupId}`, and `PATCH /{groupId}`, including malformed UUIDs, invalid pagination, unsupported values, and 400/401/403/404/409 outcomes in `server/tests/controllers/study-group.created.controller.spec.mjs`
- [X] T028 [P] [US2] Add Supertest integration coverage for persisted created lists, host detail privacy, edit persistence, and post-start edit rejection in `server/tests/integration/study-group.created.api.spec.mjs`

### Implementation for User Story 2

- [X] T029 [US2] Implement created-list/detail projections, pending counts, lifecycle/status ordering, pagination, and metadata update SQL in `server/src/models/study-group.models.mjs`
- [X] T030 [US2] Implement host detail authorization, effective-status reconciliation, edit validation, and created-list orchestration in `server/src/services/study-group.services.mjs`
- [X] T031 [US2] Implement created-list, detail, and edit controllers/routes in `server/src/controllers/study-group.controllers.mjs` and `server/src/routes/study-group.routes.mjs`
- [X] T032 [P] [US2] Add mirrored created-tab, lifecycle, edit, empty, loading, stale, and error strings in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T033 [US2] Replace `mockCreatedGroups` with paginated persisted data, server ordering, loading/error/empty/retry states, and stable selection in `client/app/dashboard/user/yourstudygroups/page.tsx`
- [X] T034 [US2] Connect subject/title/description/dynamic requirements editing, save validation, authoritative refresh, and read-only historical states in `client/app/components/organisms/StudyGroupInfoModal.tsx`
- [X] T035 [US2] Adapt created-mode lifecycle badges, pending counts, room/session fields, and server DTO IDs without mock imports in `client/app/components/molecules/StudyGroupCard.tsx`

**Checkpoint**: A host can independently view and edit persisted eligible groups with exact required ordering.

---

## Phase 5: User Story 3 — Manage Requests and Members (Priority: P2)

**Goal**: Let hosts approve/deny Pending requests and remove Approved members without exceeding capacity or drifting counts.

**Independent Test**: Exercise approval, final-place race, denial, stale cancelled request, and removal on Upcoming/Full groups; verify count/status changes once and all actions are rejected after start.

### Tests for User Story 3

- [X] T036 [P] [US3] Add service tests for host authorization, approval/denial eligibility, final-place concurrency, conditional Pending updates, member removal, count reconciliation, Full/Upcoming transitions, and stale actions in `server/tests/services/study-group.management.spec.mjs`
- [X] T037 [P] [US3] Add controller/contract tests for approve, deny, and member-removal operations with structured stale/full/forbidden conflicts in `server/tests/controllers/study-group.management.controller.spec.mjs`
- [X] T038 [P] [US3] Add concurrent Supertest integration tests proving one final-place approval, no negative/over-capacity counts, and immediate queue/member projections in `server/tests/integration/study-group.management.api.spec.mjs`

### Implementation for User Story 3

- [X] T039 [US3] Implement locked group/request/member reads, conditional approval/denial updates, approved-member deletion, and atomic count/status updates in `server/src/models/study-group.models.mjs`
- [X] T040 [US3] Implement host approval, denial, and removal transaction orchestration with lifecycle/capacity/stale checks in `server/src/services/study-group.services.mjs`
- [X] T041 [US3] Implement approve, deny, and member-removal controllers/routes in `server/src/controllers/study-group.controllers.mjs` and `server/src/routes/study-group.routes.mjs`
- [X] T042 [P] [US3] Add mirrored approval queue, member management, confirmation, full/stale/conflict, and action feedback strings in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T043 [US3] Replace generated applicants/members with host detail data and connect approve/deny/remove actions with confirmations, in-flight disablement, conflict feedback, and refresh in `client/app/components/organisms/StudyGroupInfoModal.tsx`
- [X] T044 [US3] Verify keyboard/focus behavior for host request/member controls and add accessible labels/status announcements in `client/app/components/organisms/StudyGroupInfoModal.tsx`

**Checkpoint**: Host membership management is independently functional and concurrency-safe.

---

## Phase 6: User Story 4 — Dissolve a Study Group Safely (Priority: P2)

**Goal**: Atomically delete the reservation and cascade-delete its Study Group and participation rows, releasing the slot without retaining dissolved history.

**Independent Test**: Dissolve an Upcoming/Full group with mixed requests; verify permanent reservation deletion, cascaded group/request deletion, slot reuse, and complete rollback under injected failure.

### Tests for User Story 4

- [X] T045 [P] [US4] Add service tests for host/status authorization, permanent deletion, cascade behavior, slot release, and complete transaction rollback at every dissolution failure point in `server/tests/services/study-group.dissolution.spec.mjs`
- [X] T046 [P] [US4] Add controller/contract tests for `POST /api/study-groups/{groupId}/dissolve` including forbidden, stale, terminal, and not-found outcomes in `server/tests/controllers/study-group.dissolution.controller.spec.mjs`
- [X] T047 [P] [US4] Add Supertest integration tests for atomic dissolution, no committed partial deletion after injected failures, cascade removal of mixed participation rows, and slot re-reservation in `server/tests/integration/study-group.dissolution.api.spec.mjs`

### Implementation for User Story 4

- [X] T048 [US4] Implement locked reservation/group reads and transaction-scoped permanent reservation deletion with Study Group/request cascades in `server/src/models/study-group.models.mjs`
- [X] T049 [US4] Implement one-transaction dissolution authorization/lifecycle orchestration so permanent reservation deletion cascades to the group and requests while any failure rolls back every change in `server/src/services/study-group.services.mjs`
- [X] T050 [US4] Implement the dissolve controller/route and return deletion confirmation in `server/src/controllers/study-group.controllers.mjs` and `server/src/routes/study-group.routes.mjs`
- [X] T051 [P] [US4] Add mirrored permanent-dissolution warning, confirmation, rollback failure, and success strings in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T052 [US4] Connect explicit dissolution confirmation, in-flight state, authoritative refresh, and immediate removal of the dissolved group in `client/app/components/organisms/StudyGroupInfoModal.tsx`

**Checkpoint**: Dissolution permanently removes the reservation-backed group and its request relationships while reliably releasing the room slot.

---

## Phase 7: User Story 6 — Discover and Request to Join Real Groups (Priority: P2)

**Goal**: Replace Study Together mock runtime data with persisted discovery and real join requests, including duplicate prevention and the 30-minute post-denial cooldown.

**Independent Test**: Discover a persisted eligible group, submit a request, verify one Pending record in both dashboards, reject concurrent duplicates, reject ineligible groups/hosts, and permit reapplication exactly 30 minutes after denial.

### Tests for User Story 6

- [X] T053 [P] [US6] Add service tests for discovery filtering/pagination, Pending-first and nearest-start ordering, privacy-safe projections, canJoin, host/full/terminal rejection, duplicate prevention, and exact 30-minute cooldown boundaries in `server/tests/services/study-group.discovery.spec.mjs`
- [X] T054 [P] [US6] Add middleware/controller/contract tests for `GET /api/study-groups`, detail visibility, and `POST /{groupId}/requests`, including malformed UUIDs, invalid filters/pagination, obsolete or unsupported query values, and `COOLDOWN_ACTIVE.retryAt` in `server/tests/controllers/study-group.discovery.controller.spec.mjs`
- [X] T055 [P] [US6] Add Supertest integration tests for real discovery, concurrent duplicate submissions, denied-history reapplication, and host queue visibility in `server/tests/integration/study-group.discovery.api.spec.mjs`

### Implementation for User Story 6

- [X] T056 [US6] Implement discovery query/filter/pagination, creator and Approved exclusion before pagination, Pending-first/nearest-start ordering, current-user participation projection, latest-denial lookup, and Pending insert SQL in `server/src/models/study-group.models.mjs`
- [X] T057 [US6] Implement discovery projection, eligibility, optional-auth privacy, request normalization, duplicate protection, and 30-minute cooldown orchestration in `server/src/services/study-group.services.mjs`
- [X] T058 [US6] Implement discovery and request-submission controllers/routes with optional authentication for reads and required authentication for submission in `server/src/controllers/study-group.controllers.mjs` and `server/src/routes/study-group.routes.mjs`
- [X] T059 [P] [US6] Add mirrored discovery loading/error/empty, request eligibility, Pending, cooldown countdown/retry, duplicate, and submission feedback strings in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T060 [US6] Replace `mockStudyGroups`, console submission, and local Pending state with paginated API data, server filters and ordering, retry states, Pending Cancel Request, and authoritative mutation refresh in `client/app/study-together/page.tsx`
- [X] T061 [P] [US6] Adapt grid pagination/empty states to server metadata while preserving current presentation in `client/app/components/organisms/StudyGroupGrid.tsx`
- [X] T062 [P] [US6] Adapt explore cards to `canJoin`, persisted participation, Full/terminal status, and retry metadata in `client/app/components/molecules/StudyGroupCard.tsx`
- [X] T063 [US6] Connect persisted detail and join submission with accessible loading/error/cooldown states in `client/app/components/organisms/StudyGroupInfoModal.tsx` and `client/app/components/organisms/RequestToJoinModal.tsx`

**Checkpoint**: Study Together is independently backed by real data and produces real, concurrency-safe host requests.

---

## Phase 8: User Story 5 — Manage Groups I Joined (Priority: P3)

**Goal**: Show Approved/Pending/Denied persisted participation in order and allow approved participants to leave or Pending applicants to cancel.

**Independent Test**: Seed all participant statuses, verify Approved → Pending → Denied ordering, leave an Approved future group, cancel a Pending request, and verify count/status plus both participant/host views update immediately.

### Tests for User Story 5

- [X] T064 [P] [US5] Add service tests for joined ordering/tie-breaks, retained denial history, leave eligibility/count transitions, pending cancellation ownership, stale action rejection, and host self-action prevention in `server/tests/services/study-group.joined.spec.mjs`
- [X] T065 [P] [US5] Add middleware/controller/contract tests for `GET /joined`, `DELETE /requests/{requestId}`, and `DELETE /membership`, including malformed UUIDs, invalid pagination, unsupported values, and forbidden/not-found/stale responses in `server/tests/controllers/study-group.joined.controller.spec.mjs`
- [X] T066 [P] [US5] Add Supertest integration tests proving cancel removal from both queues within the response cycle and leave count/Full-to-Upcoming consistency in `server/tests/integration/study-group.joined.api.spec.mjs`

### Implementation for User Story 5

- [X] T067 [US5] Implement joined projection/order SQL, owned Pending deletion, Approved membership deletion, and locked count/status update queries in `server/src/models/study-group.models.mjs`
- [X] T068 [US5] Implement joined-list, participant cancel, and voluntary leave orchestration with lifecycle/ownership/stale checks in `server/src/services/study-group.services.mjs`
- [X] T069 [US5] Implement joined-list, cancel-request, and leave controllers/routes in `server/src/controllers/study-group.controllers.mjs` and `server/src/routes/study-group.routes.mjs`
- [X] T070 [P] [US5] Add mirrored joined-tab statuses, empty/loading/error, leave/cancel confirmations, and action feedback strings in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T071 [US5] Replace `mockJoinedGroups` with paginated persisted joined data and required Approved/Pending/Denied ordering in `client/app/dashboard/user/yourstudygroups/page.tsx`
- [X] T072 [US5] Connect Approved leave and Pending cancellation actions, confirmations, in-flight states, stale feedback, and list/detail refresh in `client/app/components/organisms/StudyGroupInfoModal.tsx`

**Checkpoint**: Participant dashboard and self-service actions are independently functional and consistent with host views.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Complete contract coverage, localization/theme/accessibility, performance, cleanup, and end-to-end regression across stories.

- [X] T073 [P] Add OpenAPI response/error conformance assertions for all Study Group operations in `server/tests/integration/study-group.contract.spec.mjs`
- [X] T074 Reconcile effective status and `current_num` assertions across all read/mutation paths and add cross-story regression cases in `server/tests/services/study-group.lifecycle.spec.mjs`
- [X] T075 [P] Remove runtime imports of `client/app/study-together/mockData.ts`, retain only explicitly named test fixtures if needed, and verify production types come from `client/app/types/studyGroup.ts`
- [X] T076 Run locale synchronization and remove all hard-coded user-facing strings from touched Study Group/room/dashboard files using `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T077 Audit responsive light/dark styles and verify the accepted mobile/tablet/desktop layouts in `client/app/components/organisms/RoomDetailPanel.tsx`, `client/app/components/organisms/StudyGroupInfoModal.tsx`, and `client/app/dashboard/user/yourstudygroups/page.tsx`; product-owner presentation acceptance recorded on 2026-07-22
- [X] T078 Audit dialog semantics, focus trapping/restoration, Escape handling, keyboard controls, labels, and live status feedback in `client/app/components/organisms/StudyGroupInfoModal.tsx` and `client/app/components/organisms/RequestToJoinModal.tsx`
- [X] T079 [P] Add a repeatable warmed-up normal-load performance harness using exactly 25 concurrent clients, 15% each for discovery/created/joined/detail reads, 8% each for join/approval/denial/Pending-cancellation/leave mutations, at least 100 samples for every named operation, per-operation and aggregate p50/p95/error-rate output, cancellation-propagation timing, and consistency assertions in `server/tests/performance/study-group.performance.spec.mjs`; use `EXPLAIN` evidence to adjust indexes only in `database/init_db/postgres/06_indexes.sql`
- [X] T080 Add an integration test that cancels a linked reservation through the existing room-reservation workflow and verifies the Study Group API immediately reports the group as non-joinable/non-manageable and rejects stale join, edit, approval, denial, removal, leave, and dissolve actions in `server/tests/integration/study-group.external-reservation.api.spec.mjs`
- [X] T081 Run all server tests/audit, including the external-reservation integration suite, and fix feature regressions in `server/tests/` and affected `server/src/` files
- [X] T082 Run client locale sync, lint, production build, and audit; fix new feature findings in affected files under `client/app/`
- [X] T083 Execute and product-owner verify the required functional and presentation scenarios, including localized views and cross-account updates; record final acceptance in `specs/026-study-group-feature/quickstart.md` on 2026-07-22
- [X] T084 Verify implementation matches every operation/schema/error in `specs/026-study-group-feature/contracts/study-groups.openapi.yaml` and update contract documentation only for intentional approved deviations
- [ ] T085 Execute the normal-load harness with the specified dataset, exactly 25 concurrent clients, and defined operation mix; record environment, warm-up, per-operation sample count, per-operation and aggregate p50/p95/error rate, two-second threshold results, and consistency outcomes in `specs/026-study-group-feature/quickstart.md`
- [ ] T086 Conduct the first-time-user creation study with at least ten participants who have not used Study Group Mode, starting after room-slot selection and without procedural assistance; record completion time, completion rate, validation failures, blockers, and whether successful participants divided by total participants is at least 0.90 in `specs/026-study-group-feature/quickstart.md`

**Checkpoint**: All selected stories pass automated and quickstart validation with no Freely Mode regression.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks every story.
- **Phase 3 — US1 (MVP)**: Depends on Phase 2.
- **Phase 4 — US2**: Depends on Phase 2 and uses the creation/projection foundation from US1 for realistic data; can be developed against fixtures while US1 UI completes.
- **Phase 5 — US3**: Depends on Phase 2 plus the host detail/edit projection established by US2.
- **Phase 6 — US4**: Depends on Phase 2 plus host detail/authorization from US2; can run parallel to late US3 UI work.
- **Phase 7 — US6**: Depends on Phase 2; request submission must complete before US5 can exercise participant cancellation against real requests.
- **Phase 8 — US5**: Depends on Phase 2 and the request/membership lifecycle from US3 and US6.
- **Phase 9 — Polish**: Depends on every story selected for release.

### User Story Dependency Graph

```text
Setup → Foundation → US1 (creation/MVP)
                   ├──→ US2 (created dashboard/edit) ──→ US3 (host management) ──┐
                   │                          └───────→ US4 (dissolution) ───────┤
                   └──→ US6 (discovery/join requests) ──────────────────────────┤
                                                US3 + US6 ──→ US5 (participant) ┤
                                                                                └──→ Polish
```

### Within Each User Story

1. Write story tests and confirm expected failures.
2. Implement/extend model queries and transaction primitives.
3. Implement service business rules and authorization.
4. Expose controller and route contract.
5. Add mirrored locale keys and integrate frontend.
6. Run the independent story checkpoint before moving on.

## Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001 begins because they target independent client/test files.
- T007 and T011 can be authored in parallel with foundational implementation, then executed after T005–T010.
- Test files marked [P] within each story can be written simultaneously before story implementation.
- Locale tasks marked [P] can run alongside backend implementation once user-facing error/status codes are fixed by the contract.
- US4 backend work can run alongside late US3 frontend work; US6 can run in parallel with US2 after Foundation if shared model edits are coordinated.

## Parallel Examples by User Story

### US1

```text
Parallel: T016 service tests | T017 controller tests | T018 integration tests
After backend contract stabilizes: T022 locale keys alongside T019–T021 backend implementation
```

### US2

```text
Parallel: T026 service tests | T027 controller tests | T028 integration tests
After endpoint behavior is fixed: T032 locale keys alongside T029–T031 backend implementation
```

### US3

```text
Parallel: T036 service/concurrency tests | T037 controller tests | T038 integration tests
After action codes are fixed: T042 locale keys alongside T039–T041 backend implementation
```

### US4

```text
Parallel: T045 rollback tests | T046 controller tests | T047 integration tests
After dissolution responses are fixed: T051 locale keys alongside T048–T050 backend implementation
```

### US6

```text
Parallel: T053 discovery/cooldown tests | T054 controller tests | T055 integration tests
Frontend split after endpoint stability: T061 grid adapter | T062 card adapter, then integrate via T060/T063
```

### US5

```text
Parallel: T064 joined/action tests | T065 controller tests | T066 integration tests
After action codes are fixed: T070 locale keys alongside T067–T069 backend implementation
```

## Implementation Strategy

### MVP First — US1 Only

1. Complete Setup (T001–T004).
2. Complete Foundation (T005–T015).
3. Write US1 tests (T016–T018) and confirm expected failures.
4. Implement US1 (T019–T025).
5. Stop and validate atomic creation plus Freely Mode regression before adding collaboration behavior.

### Incremental Delivery

1. **MVP**: US1 — reservation-backed creation.
2. **Host visibility**: US2 — persisted created dashboard and editing.
3. **Host collaboration**: US3 — requests and members.
4. **Lifecycle safety**: US4 — permanent cancellation/dissolution.
5. **Discovery funnel**: US6 — real Study Together and requests.
6. **Participant self-service**: US5 — joined dashboard, leave, cancel.
7. **Release hardening**: Phase 9, including repeatable performance measurement and the first-time-user acceptance study.

### Parallel Team Strategy

After Foundation:

- Backend owner: transaction/model primitives and story services in dependency order.
- Frontend owner A: creation then created dashboard/modal.
- Frontend owner B: discovery/card/grid and participant views after shared DTOs.
- Test owner: test-first contract/concurrency suites, then cross-story lifecycle verification.

Coordinate edits to `study-group.models.mjs`, `study-group.services.mjs`, `StudyGroupInfoModal.tsx`, and locale files because they are shared hotspots and are not safe simultaneous write targets.

## Notes

- `[P]` means safe file-level parallelism, not permission to ignore phase/story dependencies.
- Every story-phase task carries its original `[US#]` label for traceability.
- Server/database time is authoritative for lifecycle and cooldown decisions.
- Do not add a duplicate Study Group/request/reservation table; repair and reuse authoritative schema.
- Preserve current layout as reference and synchronize all new UI with the existing interface.
- [X] T087 Add persisted email invitation creation, notification listing, recipient-only Accept/Deny decisions, capacity locking, mail compensation, realtime events, and backend regression coverage in the Study Group backend layers and `server/src/utils/mailer.mjs`
- [X] T088 Add the Group I Created inline expanding email action beside Members, notification-bell invitation tray/detail popup, email-link return flow, Joined success feedback, EN/VI strings, and frontend validation in the existing Study Group/dashboard components
- [X] T089 Update Study Group specification, data model, plan, OpenAPI contract, and quickstart invitation acceptance scenarios without modifying the authoritative SQL schema
- [X] T090 Present localized Subject/Members, Date/Time, and Branch/Room metadata in notification invitation items and details
- [X] T091 Convert Created and Joined status controls to multi-select filters where All Status clears the selection
- [X] T092 Require a localized in-app confirmation before removing an Approved Study Group member
- [X] T093 Merge persisted Study Group and Freely Mode reservation schedules into Dashboard Calendar and Overview with purple/blue distinction and linked-reservation deduplication
- [X] T094 Add bilingual post-commit email notification for a member removed by the host, with SMTP failure isolated from the committed membership change
- [X] T095 Capture distinct active non-host recipients before dissolution and send bilingual cancellation emails after the permanent deletion commits
- [X] T096 Emit targeted removal/dissolution Socket.IO notifications and persist connected recipients' compact/read-detail bell items in account-scoped browser storage without changing the database schema
- [X] T097 Align authenticated Socket.IO user rooms with the canonical JWT `userId` claim and reject tokens without a user identifier so targeted lifecycle notifications reach the intended account
- [X] T098 Return current Approved members in Study Group detail and render them read-only in Study Together popups when present while preserving Joined Pending/Denied presentation and host-only request privacy
- [X] T099 Enforce the host-only dissolution cutoff at least three hours before the Vietnam-time reservation start in backend authorization and transaction checks, hide the stale client action, and add boundary regression coverage
- [X] T100 Enforce the Approved-member leave cutoff at least three hours before the Vietnam-time reservation start, email the creator after commit, emit a targeted local bell notification naming the departing member, and add boundary/lifecycle regression coverage without changing the database schema
- [X] T101 Project detail-only organizer, Approved-member, and Pending-applicant profile fields and add one localized, keyboard-accessible hover/focus preview to their avatar/name triggers inside Study Together, Created, Approved Joined detail popups, and the host's Pending approval queue using `profile-view-layout.txt` as layout reference; always render Email, Date of birth, Phone number, Gender, Occupation, and Hometown with Unknown fallbacks, leave outer cards unchanged, and add regression coverage without schema changes
- [X] T102 Capture the user who performs each existing Study Group email/bell lifecycle action and present their avatar when available, username, and email in invitation, removal, voluntary-leave, and dissolution email plus selected notification details without changing SQL schema or cluttering compact bell items
- [X] T103 Add shareable URL-backed detail modals for `/study-together/{groupId}`, `/dashboard/user/yourstudygroups/created/{groupId}`, and `/dashboard/user/yourstudygroups/joined/{groupId}` with client-side History navigation, Back/Forward synchronization, direct-load detail resolution and relationship checks, localized loading/unavailable states, and preservation of each underlying list/filter/tab/pagination/scroll experience
- [X] T104 Merge invitation and lifecycle bell items into one deterministic newest-first timeline, replace the notification tray's native scrollbar with a thin rounded light/dark overlay that has no arrow buttons, and distinguish dissolution/cancellation using a red warning icon
- [X] T105 Add the approved balanced Study Group communication matrix: email-plus-bell for request submission/decision and member entry, bell-only for request cancellation/invitation decline/metadata update, post-commit member counts, stable non-duplicating event snapshots, safe invitation review links, permission-aware Created/Joined/general CTA routing with stale fallback, EN/VI content, and backend/client regression coverage without changing SQL schema
- [X] T106 Separate Pending invitations from join-request cards in Your Study Groups: add an Invitations tab with invitation-specific Accept/Deny cards and no status filter, preserve relationship type through the client view model, expose Cancel Request only for `type=request`, include only Approved invitations in Joined, and omit resolved or no-longer-actionable invitations without changing SQL schema
- [X] T107 Reject librarian/admin invitation recipients using the persisted user role before relationship creation or email delivery, localize the validation response, and hide Study Together join actions and join-modal entry points from staff viewers while retaining backend authorization
- [X] T108 Treat Join Group on a Study Together card with a Pending invitation as explicit invitation acceptance, keep Cancel Request exclusive to join requests, harden card/popup text overflow, anchor popup actions beside tags independently of title length, and paginate Invitations at six cards/two desktop rows using the shared dashboard controls
- Commit after each task or coherent dependency group; stop at each checkpoint for independent verification.
