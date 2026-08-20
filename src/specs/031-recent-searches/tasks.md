# Tasks: Recent Search History for Logged-In Users

**Input**: Design documents from `/specs/031-recent-searches/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify design artifacts and feature structure

- [x] T001 Verify project structure and spec design documents in `specs/031-recent-searches/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that MUST be complete before ANY user story UI can be integrated

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Implement search history query helpers (get recent searches, record search query) in `server/src/services/search.services.mjs`
- [x] T003 Implement search history controllers (`getSearchHistory`, `recordSearchQuery`) in `server/src/controllers/search.controllers.mjs`
- [x] T004 Register search history API routes (`GET /api/search/history`, `POST /api/search/history`) with auth middleware in `server/src/routes/search.routes.mjs`

**Checkpoint**: Foundation ready - backend API for search history is functional and testable

---

## Phase 3: User Story 1 - Display Top 5 Recent Searches (Priority: P1) 🎯 MVP

**Goal**: Authenticated user sees up to 5 of their most recent search queries when focusing the search input bar.

**Independent Test**: Log in, submit searches, click/focus search input bar, and verify top 5 recent search terms appear in a styled dropdown.

### Implementation for User Story 1

- [x] T005 [P] [US1] Create API utility helpers for fetching and saving search history in `client/app/utils/searchApi.ts`
- [x] T006 [P] [US1] Add English and Vietnamese localization keys for recent searches in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [x] T007 [US1] Create `RecentSearchesDropdown` component with theme and i18n support in `client/app/components/molecules/RecentSearchesDropdown.tsx`
- [x] T008 [US1] Integrate `RecentSearchesDropdown` and focus state handling into `client/app/components/molecules/SearchBar.tsx`

**Checkpoint**: User Story 1 is fully functional - logged-in users can view their top 5 recent searches in the dropdown.

---

## Phase 4: User Story 2 - Quick Search Execution & History Update (Priority: P2)

**Goal**: Clicking a recent search term populates the search bar, executes the search, and updates the query's timestamp to rank #1.

**Independent Test**: Click a recent search item from the dropdown, verify search results refresh, and verify the query updates to rank 1.

### Implementation for User Story 2

- [x] T009 [US2] Update `RecentSearchesDropdown` item click handler to populate input, execute search, and trigger timestamp refresh in `client/app/components/molecules/SearchBar.tsx`
- [x] T010 [US2] Update `search.services.mjs` upsert logic to refresh `created_at` timestamp for existing queries in `server/src/services/search.services.mjs`

**Checkpoint**: User Story 2 is functional - clicking a recent search term executes the search and re-ranks the item to #1.

---

## Phase 5: User Story 3 - Guest / Unauthenticated Fallback Behavior (Priority: P3)

**Goal**: Guest users perform searches without seeing search history or saving search entries.

**Independent Test**: Focus search input as a guest user; verify no search history dropdown appears and no backend history calls fail.

### Implementation for User Story 3

- [x] T011 [US3] Add authentication state check in `SearchBar.tsx` to conditionally render `RecentSearchesDropdown` only for logged-in users
- [x] T012 [US3] Verify unauthenticated guest safety in search routes and services in `server/src/routes/search.routes.mjs`

**Checkpoint**: All user stories functional and independently isolated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Code quality, visual polish, and validation

- [x] T013 [P] Verify responsive design and theme tokens (light/dark) for recent search dropdown in `client/app/components/molecules/RecentSearchesDropdown.tsx`
- [x] T014 Execute full manual testing flow per `specs/031-recent-searches/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion.
- **User Story 3 (Phase 5)**: Depends on Phase 3 completion.
- **Polish (Phase 6)**: Depends on Phases 3-5 completion.

### Parallel Opportunities

- T005 (`searchApi.ts`) and T006 (`en.json`/`vi.json`) can be implemented in parallel.
- T013 (Styling/Theme verification) can run in parallel with polish tasks.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational backend endpoints).
2. Implement Phase 3 (User Story 1 - Recent search dropdown display).
3. Test User Story 1 independently.

### Incremental Delivery
1. Add User Story 2 (Click-to-search & timestamp re-ranking).
2. Add User Story 3 (Guest user safety & clean fallback).
3. Complete Phase 6 (Polish & quickstart validation).
