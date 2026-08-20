# Tasks: User Dashboard Recommendation Page

**Input**: Design documents from `/specs/010-user-dashboard-recommendation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No explicit tests requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create page directory `client/app/dashboard/user/recommendations/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T002 Implement data fetching utilities/services in frontend to connect to the backend recommendation APIs for user history and trending books.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Recommended Books (Priority: P1) 🎯 MVP

**Goal**: Display personalized and trending recommendations fetching data from backend using identical carousels as the book details page.

**Independent Test**: Navigate to the recommendation page and verify both carousels are present, contain real book cards fetched from the backend, and are scrollable using the left/right arrows.

### Implementation for User Story 1

- [X] T003 [US1] Implement recommendation page UI in `client/app/dashboard/user/recommendations/page.tsx` to fetch data from backend and render two `RecommendationCarousel` components. Handle loading and error states.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Consistent Layout and Integration (Priority: P1)

**Goal**: Seamlessly integrate the recommendation page into the existing dashboard layout.

**Independent Test**: Visually inspect the page to confirm the presence of the navbar, footer, and sidebar, and ensure proper adaptation to dark mode.

### Implementation for User Story 2

- [X] T004 [US2] Add translation keys for "Recommended Books", "Based on your reading history", and "Trending this week" in `client/locales/en.json` (or standard `en.json` location) and `client/locales/vi.json` (or standard `vi.json` location).
- [X] T005 [US2] Update sidebar component (e.g., in `client/app/dashboard/layout.tsx` or similar sidebar file) to highlight the "Recommended Books" link when active.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T006 Ensure dark mode styling works perfectly across the newly added page structure.
- [X] T007 Run quickstart.md validation to ensure the page behaves as documented.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can run concurrently with or immediately after US1

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- User Story 2 tasks (like adding translations) can be done in parallel with User Story 1 implementation.

---

## Parallel Example: User Story 1 & 2

```bash
# Launch implementation of page UI and translation keys in parallel:
Task: "[US1] Implement recommendation page UI in client/app/dashboard/user/recommendations/page.tsx"
Task: "[US2] Add translation keys for 'Recommended Books', 'Based on your reading history', and 'Trending this week'"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories
