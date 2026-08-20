# Tasks: AI Personalized Recommendations

**Input**: Design documents from `/specs/027-ai-user-recommendations/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/recommendations-contract.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Exact file paths are specified in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic environment configurations

- [X] T001 Configure Python environment and verify installation of packages (psycopg2-binary, lightgbm, scikit-learn, pandas, numpy, neo4j, python-dotenv) in `database/Init_data/`
- [X] T002 Add environment variables (RECOMMENDATION_PORT=5001, RECOMMENDATION_RETRAIN_CRON) in `server/.env`
- [X] T003 [P] Add unique and performance indexes for recommends table in `database/Data_schema.sql`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TCP socket communication framework and server-side caching structure

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement persistent Python TCP socket server in `server/src/recommendation/predict_server.py` that loads Booster once and checks file modification time for auto-reloading
- [X] T005 [P] Implement Node.js TCP socket client handler in `server/src/services/recommendation.services.mjs`
- [X] T006 [P] Initialize local memory cache map `recommendationCache` with TTL settings in `server/src/services/recommendation.services.mjs`
- [X] T007 Implement the central cache invalidation helper function `invalidateUserRecommendationCache` in `server/src/services/recommendation.services.mjs`
- [X] T008 [P] Mount routing structures and setup empty endpoint controllers in `server/src/routes/recommendation.routes.mjs` and `server/src/controllers/recommendation.controllers.mjs`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Personalized Recommendations on User Dashboard (Priority: P1) 🎯 MVP

**Goal**: Fetch personalized candidates from Memgraph, retrieve features in bulk, request ranking from Python over socket, cache recommendations, and render in client dashboard.

**Independent Test**: Log in with a user having interaction history, check `GET /api/dashboard/user/recommendations` returns personalized book list in `historyBased` matching user's taste, excluding wishlist and borrow items.

### Implementation for User Story 1

- [X] T009 [P] [US1] Update `fetchPersonalizedCandidates` in `server/src/services/recommendation.services.mjs` to fetch GCN predictions from Memgraph
- [X] T010 [US1] Implement single bulk PostgreSQL query to fetch `past_impressions_count`, `is_in_wishlist`, and `global_available_copies` in `server/src/services/recommendation.services.mjs`
- [X] T011 [US1] Implement `generateRecommendations` and `getUserRecommendations` coordinating candidate retrieval, features compilation, socket scoring, SQL storage, and memory caching in `server/src/services/recommendation.services.mjs`
- [X] T012 [US1] Implement controller handler `getRecommendations` in `server/src/controllers/recommendation.controllers.mjs`
- [X] T013 [P] [US1] Create personalized recommendation carousel interface on dashboard in `client/app/dashboard/user/recommendations/page.tsx`
- [X] T014 [US1] Call cache invalidation helper on book reservation in `server/src/services/library.services.mjs` and wishlist add in `server/src/services/wishlist.services.mjs`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Renew Personalized Recommendations (Priority: P2)

**Goal**: Support recommendation renewal, archiving active ones in PostgreSQL, invalidating caches, and generating new ones excluding previously recommended books.

**Independent Test**: Click "Renew Recommendations" on dashboard, verify loading spinner displays, and new books are generated. Check that previously recommended books are excluded.

### Implementation for User Story 2

- [X] T015 [US2] Implement `renewUserRecommendations` in `server/src/services/recommendation.services.mjs` to set `renewed_at = CURRENT_TIMESTAMP` for active items
- [X] T016 [US2] Query previously recommended books and filter them out of candidate pools with catalog-exhaustion fallback in `server/src/services/recommendation.services.mjs`
- [X] T017 [US2] Implement controller handler `renewRecommendations` in `server/src/controllers/recommendation.controllers.mjs`
- [X] T018 [US2] Add renew trigger, request dispatching, and loading states in `client/app/dashboard/user/recommendations/page.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Track Recommendation Interaction (Priority: P2)

**Goal**: Track clicks on recommended books, update PostgreSQL records, invalidate user caches, and sync to Memgraph asynchronously.

**Independent Test**: Clicking a book card redirects to details, sets `is_clicked = true` in PostgreSQL, and generates a corresponding edge in Memgraph.

### Implementation for User Story 3

- [X] T019 [US3] Implement `logRecommendationClick` in `server/src/services/recommendation.services.mjs` to set `is_clicked = true` and `renewed_at = now`
- [X] T020 [P] [US3] Implement async background synchronization handler in `server/src/services/memgraphSync.services.mjs`
- [X] T021 [US3] Implement controller handler `clickRecommendation` in `server/src/controllers/recommendation.controllers.mjs`
- [X] T022 [US3] Bind click tracking endpoints to card onClick events in `client/app/dashboard/user/recommendations/page.tsx`

**Checkpoint**: User Stories 1, 2, and 3 are functional and testable independently

---

## Phase 6: User Story 4 - View Trending Recommendations (Priority: P2)

**Goal**: Fetch trending books based on 30-day activity, excluding current user's wishlist, borrow history, and previously recommended books.

**Independent Test**: Navigate to the dashboard and check the "Trending this week" carousel displays books with high global interactions, excluding active borrows and wishlist.

### Implementation for User Story 4

- [X] T023 [P] [US4] Implement `fetchTrendingCandidates` SQL query in `server/src/services/recommendation.services.mjs` using 30-day interactions and user exclusions
- [X] T024 [US4] Implement `getTrendingRecommendations` returning top 6 trending books in `server/src/services/recommendation.services.mjs`
- [X] T025 [US4] Create trending recommendations carousel on dashboard in `client/app/dashboard/user/recommendations/page.tsx`

**Checkpoint**: All user stories are independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Scheduler automation, testing, translations, and script validation

- [X] T026 [P] Implement automated retraining scheduler using node-cron in `server/src/services/scheduler.services.mjs`
- [X] T027 Write comprehensive integration tests verifying cache, socket inference, click tracking, and renew/exclude logic in `server/tests/recommendation.test.mjs`
- [X] T028 [P] Add en/vi localization translation keys for recommendations text in `client/locales/en.json` and `client/locales/vi.json`
- [X] T029 Execute full validation checklist using `specs/027-ai-user-recommendations/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: Depend on Foundational phase completion
  - Stories can then proceed in parallel or sequentially in priority order (P1 → P2)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 - Integrates with US1 renewal trigger
- **User Story 3 (P3)**: Can start after Phase 2 - Integrates with US1 click tracking
- **User Story 4 (P4)**: Can start after Phase 2 - No dependencies on other stories

### Parallel Opportunities

- Setup tasks (T003) and Foundational tasks (T005, T006, T008) can run in parallel
- Once Phase 2 completes, US1, US2, US3, and US4 implementation can proceed concurrently
- Model-related tasks and UI-related tasks within each user story can run in parallel (e.g., T013 and T009)

---

## Parallel Example: User Story 1

```bash
# Launch models and frontend in parallel
Task: "Update fetchPersonalizedCandidates in server/src/services/recommendation.services.mjs"
Task: "Create personalized recommendation carousel interface on dashboard in client/app/dashboard/user/recommendations/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (MVP)
4. **STOP and VALIDATE**: Verify personalized recommendations load under 100ms via cache/PG

### Incremental Delivery

1. Setup + Foundational → Core socket/cache communication ready
2. Add User Story 1 → Render personalized carousel (MVP!)
3. Add User Story 2 → Enable renew/refresh action excluding old recommendations
4. Add User Story 3 → Track clicks and sync to Memgraph
5. Add User Story 4 → Render trending carousel
6. Complete Polish → Run test suites and verify localization
