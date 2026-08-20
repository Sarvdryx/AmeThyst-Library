# Tasks: Memgraph Recommendation DB Synchronization

**Input**: Design documents from `/specs/024-memgraph-recommendation-db-sync/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `server/src/`, `server/tests/`
- Paths shown below assume relative paths from the root of the workspace.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify and configure dotenv environment variables for Memgraph connection in `server/.env` and `server/src/config/env.mjs`
- [ ] T002 [P] Establish connection helper and client pool verification for Memgraph in `server/src/config/memgraph.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create base Neo4j driver queries and error logging utilities inside `server/src/config/memgraph.mjs`
- [ ] T004 Define empty check query and constraint execution handlers in `server/src/services/memgraphSync.services.mjs`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Unified Graph Ingestion & Schema Initialization (Priority: P1) 🎯 MVP

**Goal**: Automatically check and initialize the Memgraph database schema and import all baseline data on server startup if the graph is empty.

**Independent Test**: Start the Express server and run verification queries on `mgconsole` or Memgraph Lab to confirm count of loaded `Book`, `User`, `Branch`, `Genre`, `Author`, and relationship edges.

### Tests for User Story 1
- [ ] T005 [P] [US1] Create startup verification unit test in `server/tests/memgraphSync.test.mjs`

### Implementation for User Story 1
- [ ] T006 [US1] Implement automatic constraint and index creation queries on startup inside `server/src/services/memgraphSync.services.mjs`
- [ ] T007 [US1] Implement baseline data querying from Postgres for Users, Books, Branches, and Libraries inside `server/src/services/memgraphSync.services.mjs`
- [ ] T008 [US1] Implement baseline data seeding queries from Postgres for user_wishlist, search_history, and borrow_book inside `server/src/services/memgraphSync.services.mjs`
- [ ] T009 [US1] Hook the automatic check, constraint initialization, and baseline seeding calls into `server/src/server.mjs`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Real-Time Synchronization of User Wishlist Actions (Priority: P2)

**Goal**: Synchronize user wishlist additions/removals with the graph database in real-time.

**Independent Test**: Perform wishlist actions through the API and assert `WISHLISTED` relationships are created/removed.

### Tests for User Story 2
- [ ] T010 [P] [US2] Add wishlist synchronization integration tests in `server/tests/memgraphSync.test.mjs`

### Implementation for User Story 2
- [ ] T011 [P] [US2] Implement `syncWishlistToMemgraph` function with idempotent MERGE and DELETE Cypher queries inside `server/src/services/memgraphSync.services.mjs`
- [ ] T012 [P] [US2] Create Postgres models for wishlist CRUD in `server/src/models/wishlist.models.mjs`
- [ ] T013 [US2] Implement wishlist service functions to coordinate Postgres writes and trigger Memgraph sync in `server/src/services/wishlist.services.mjs`
- [ ] T014 [US2] Hook wishlist service functions into user dashboard routes in `server/routes/dashboard.user.routes.mjs`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Synchronization of System Recommendations and User Interactions (Priority: P2)

**Goal**: Sync system recommendation logs and user click interactions.

**Independent Test**: Simulate recommendation generation and click updates, asserting `RECOMMENDED` relationships match.

### Tests for User Story 3
- [ ] T015 [P] [US3] Add recommendation synchronization integration tests in `server/tests/memgraphSync.test.mjs`

### Implementation for User Story 3
- [ ] T016 [P] [US3] Implement `syncRecommendationToMemgraph` function with idempotent MERGE Cypher queries inside `server/src/services/memgraphSync.services.mjs`
- [ ] T017 [US3] Hook recommendation sync triggers into the recommendation retrieval and click endpoints in `server/src/services/dashboard.user.services.mjs`

**Checkpoint**: User Stories 1, 2, and 3 should now be independently functional.

---

## Phase 6: User Story 4 - Real-Time Search History Syncing (Priority: P3)

**Goal**: Track user search query history and clicked search results.

**Independent Test**: Run search queries and clicks, and assert `SEARCHED` relationships exist in Memgraph.

### Tests for User Story 4
- [ ] T018 [P] [US4] Add search history synchronization integration tests in `server/tests/memgraphSync.test.mjs`

### Implementation for User Story 4
- [ ] T019 [US4] Update search log click handler inside `server/src/services/history.services.mjs` to invoke `syncSearchClickToMemgraph` asynchronously

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 Run the full test suite in `server/tests/memgraphSync.test.mjs` and ensure all test scenarios pass
- [ ] T021 [P] Update API documentation and quickstart instructions in `specs/024-memgraph-recommendation-db-sync/quickstart.md`
- [ ] T022 Optimize Cypher query performance with connection pool tuning in `server/src/config/memgraph.mjs`
- [ ] T023 Verify fail-safe error handling for Memgraph offline scenarios across all services in `server/src/services/memgraphSync.services.mjs`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (P1) is the MVP and must be completed first to establish the database graph topology.
  - User Story 2 (P2), User Story 3 (P2), and User Story 4 (P3) can run in parallel once US1 establishes the schema.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) and US1 schema initialization.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) and US1 schema initialization.
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) and US1 schema initialization.

### Within Each User Story

- Tests (if included) MUST be written and fail before implementation.
- Models before services.
- Services before endpoints/hooks.
- Core implementation before integration.

### Parallel Opportunities

- T001 and T002 can run in parallel.
- All test tasks (T005, T010, T015, T018) can be developed in parallel as mock tests.
- Once US1 is implemented, implementation tasks for US2 (T011, T012), US3 (T016), and US4 (T019) can run in parallel.

---

## Parallel Example: User Story 2

```bash
# Implement the database model and the graph sync logic concurrently:
Task: "Implement syncWishlistToMemgraph function inside server/src/services/memgraphSync.services.mjs"
Task: "Create Postgres models for wishlist CRUD in server/src/models/wishlist.models.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Boot server, confirm Memgraph initializes schema and seeds baseline dataset from Postgres.

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready.
2. Add User Story 1 -> Test and seed baseline -> MVP ready.
3. Add User Story 2 -> Sync user wishlists -> Live preferences ready.
4. Add User Story 3 -> Sync system recommendations -> Recommendation feedback loop ready.
5. Add User Story 4 -> Sync search queries -> Complete context ready.
