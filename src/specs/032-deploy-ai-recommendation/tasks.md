# Tasks: AI Recommendation System Infrastructure & Cloud Deployment Pipeline (No Redis)

**Input**: Design documents from `/specs/032-deploy-ai-recommendation/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Python environment and environment variable setup for Memgraph & PostgreSQL infrastructure

- [X] T001 Verify Python dependencies (`neo4j`, `numpy`, `lightgbm`, `psycopg2-binary`) in `src/database/Init_data/requirements.txt`
- [X] T002 Configure database environment secrets (`DB_HOST`, `MEMGRAPH_URI`, `MEMGRAPH_HOST`, `MEMGRAPH_PORT`) in `src/database/.env` and `src/server/.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base database drivers and server connection scripts required before user story implementation

- [X] T003 Verify Memgraph session pool configuration in `src/server/src/config/memgraph.config.mjs`
- [X] T004 Verify persistent Python socket server initialization in `src/server/src/recommendation/predict_server.py`

---

## Phase 3: User Story 1 - Real-Time Low-Latency Recommendation Serving (Priority: P1) 🎯 MVP

**Goal**: Deliver real-time recommendation scoring using Memgraph node property lookups / in-memory cache and socket IPC in under 50ms.

**Independent Test**: Execute `npm run test:recommendation` in `src/server/` to verify latency (< 50ms) and out-of-stock item filtering.

### Implementation for User Story 1

- [X] T005 [P] [US1] Implement Memgraph node property embedding lookup & in-memory vector cache in `src/server/src/recommendation/predict_server.py`
- [X] T006 [US1] Extend LightGBM candidate feature row construction in `src/server/src/recommendation/predict_server.py` combining embeddings, dot products, and tabular context
- [X] T007 [US1] Add inventory availability guard and fallback handling in `src/server/src/services/recommendation.services.mjs`
- [X] T008 [US1] Add test cases for fallback handling and socket recommendation serving in `src/server/tests/services/recommendation.services.spec.mjs`

**Checkpoint**: User Story 1 is fully functional and independently testable as an MVP increment.

---

## Phase 4: User Story 2 - Automated Graph & Feature Synchronization (Priority: P2)

**Goal**: Automate GraphSAGE node embedding generation and graph snapshot export in CI/CD without Redis dependencies.

**Independent Test**: Run `python src/database/Init_data/GraphSAGE.py` and `python src/database/Init_data/Model_snapshot.py export` locally and verify snapshot artifact generation.

### Implementation for User Story 2

- [X] T009 [P] [US2] Update GraphSAGE training script in `src/database/Init_data/GraphSAGE.py` to attach feature embeddings directly to Memgraph node properties (`b.features`, `u.features`)
- [X] T010 [US2] Update automated retraining workflow `.github/workflows/action-retrain.yml` to execute sequential steps: `Init_graph.py`, `GraphSAGE.py`, `LightGBM.py`, and `Model_snapshot.py`
- [X] T011 [US2] Update snapshot management script in `src/database/Init_data/Model_snapshot.py` to handle graph export and cypher dump fallback

**Checkpoint**: User Story 2 is independently functional for automated model deployment.

---

## Phase 5: User Story 3 - High-Throughput Micro-Ranking with Dual Feature Integration (Priority: P3)

**Goal**: Enhance recommendation diversity with impression skip penalties and epsilon-greedy exploration.

**Independent Test**: Pass repeat impression payloads to `predict_server.py` and verify progressive score discounting.

### Implementation for User Story 3

- [X] T012 [P] [US3] Implement progressive skip penalty factor ($0.65^{\text{past\_impressions\_count}}$) in `src/server/src/services/recommendation.services.mjs`
- [X] T013 [US3] Implement epsilon-greedy exploration mixing (20% exploration probability) in `src/server/src/services/recommendation.services.mjs`

**Checkpoint**: All user stories complete and independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and full test suite regression check

- [X] T014 [P] Update local quickstart guide in `src/specs/032-deploy-ai-recommendation/quickstart.md`
- [X] T015 Run full backend test suite (`npm test` in `src/server/`) to verify zero regressions across all services

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phases 3-5)**: Depend on Foundational phase completion (P1 → P2 → P3).
- **Polish (Phase 6)**: Depends on completion of all user story phases.

---

## Parallel Execution Opportunities

- T005 [US1] and T009 [US2] can be developed in parallel (separate Python files).
- T012 [US3] can proceed in parallel once T007 [US1] is established.
- T014 [Polish] documentation updates can proceed in parallel with T015 test execution.
