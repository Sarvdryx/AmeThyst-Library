# Tasks: Book Wishlist and Dashboard Integration

**Input**: Design documents from `/specs/026-book-wishlist/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Vitest/Jest tests are temporarily ignored per user request to focus on feature execution and manual verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependency installation and basic configuration

- [X] T001 Install `neo4j-driver` in backend package config `server/package.json`
- [X] T002 [P] Configure Memgraph driver setup and environment variables in new config file `server/src/config/memgraph.config.mjs`
- [X] T003 [P] Register wishlist routes router import and middleware mounting in `server/src/server.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model, service, and routing layers in the backend

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create wishlist database queries for PostgreSQL table `user_wishlist` in new model `server/src/models/wishlist.models.mjs`
- [X] T005 [P] Create Memgraph synchronization methods `syncWishlistAdd` and `syncWishlistRemove` using idempotent Cypher queries in new service `server/src/services/memgraphSync.services.mjs`
- [X] T006 Create coordinate service to execute PostgreSQL query and dispatch background async Memgraph sync in new service `server/src/services/wishlist.services.mjs`
- [X] T007 [P] Create request/response handlers for wishlist REST API in new controller `server/src/controllers/wishlist.controllers.mjs`
- [X] T008 [P] Expose wishlist API endpoints (`GET /api/wishlist`, `GET /api/wishlist/status/:bookId`, `POST /api/wishlist/:bookId`, `DELETE /api/wishlist/:bookId`) protected by token and role check middlewares in new router `server/src/routes/wishlist.routes.mjs`

**Checkpoint**: Foundation ready - backend endpoints are fully ready to support frontend user stories.

---

## Phase 3: User Story 1 - Add Book to Wishlist (Priority: P1) 🎯 MVP

**Goal**: Add interactive heart icon on book details cover page, and enable user to successfully save a book.

**Independent Test**: Navigate to `/library/[id]`, click outlined heart icon on book cover, verify it turns red, displays a toast notification, and inserts data in Postgres/Memgraph.

### Implementation for User Story 1

- [X] T009 [P] [US1] Create interactive heart icon component under atom/molecule components in `client/app/components/atoms/WishlistHeart.tsx`
- [X] T010 [US1] Overlay the `WishlistHeart` component on the book cover wrapper in `client/app/components/templates/BookDetailTemplate.tsx`
- [X] T011 [US1] Implement state loading and fetch hooks to check and add wishlist items in `client/app/library/[id]/page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Remove Book from Wishlist (Priority: P1)

**Goal**: Support removing books from the wishlist by clicking the red heart, returning to outlined state and deleting database records.

**Independent Test**: Navigate to `/library/[id]` where book is wishlisted (red heart visible), click heart icon, verify it changes to outline, displays toast notification, and deletes record in Postgres/Memgraph.

### Implementation for User Story 2

- [X] T012 [US2] Implement delete wishlist toggle handlers in `client/app/library/[id]/page.tsx` and ensure state is correctly reset in `client/app/components/templates/BookDetailTemplate.tsx`

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - View Wishlist on Dashboard (Priority: P1)

**Goal**: Render the wishlist books on the lower line of `/dashboard/user/recommendations` page, reserving the upper line for recommendations.

**Independent Test**: Open `/dashboard/user/recommendations` as a user, verify top carousel displays recommendations, and bottom carousel displays wishlisted books.

### Implementation for User Story 3

- [X] T013 [P] [US3] Extend horizontal carousel component to handle wishlist specific titles and layout styling in `client/app/components/organisms/RecommendationCarousel.tsx`
- [X] T014 [US3] Modify recommendations page to fetch both user recommendations and user wishlist books and display them in separate carousels in `client/app/dashboard/user/recommendations/page.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Localization, theme optimization, and validation

- [X] T015 [P] Add English and Vietnamese translations for wishlist headers, states, and toast text keys in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T016 [P] Support light/dark theme CSS classes on the heart icon and dashboard carousel in `client/app/components/atoms/WishlistHeart.tsx`
- [X] T017 Run quickstart.md validation steps to test full functionality manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel or sequentially (US1 → US2 → US3).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Extends User Story 1 functionality (requires heart icon toggles).
- **User Story 3 (P3)**: Depends on US1 (to have books in the wishlist for testing).

### Within Each User Story

- Models before services.
- Services before endpoints.
- Core implementation before integration.

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel.
- Foundational tasks marked [P] can run in parallel.
- UI components and backend routing can be developed concurrently once database query services are complete.

---

## Parallel Example: User Story 1

```bash
# Launch atom/molecule component and template updates:
Task: "Create interactive heart icon component in client/app/components/atoms/WishlistHeart.tsx"
Task: "Overlay the WishlistHeart component on the book cover wrapper in client/app/components/templates/BookDetailTemplate.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Verify that adding a wishlist item updates PostgreSQL and Memgraph.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready.
2. Add User Story 1 → Test independently (MVP!).
3. Add User Story 2 → Test toggle-off capability.
4. Add User Story 3 → Verify dashboard wishlist carousel.
