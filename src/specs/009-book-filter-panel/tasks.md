# Tasks: Book Filter Panel

**Input**: Design documents from `/specs/009-book-filter-panel/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and verified manually via cURL requests and browser layouts.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend client**: `client/app/`
- **Backend server**: `server/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create component subdirectories for atoms, molecules, and organisms under `client/app/components/`
- [x] T002 [P] Create request validation middleware file `server/src/middlewares/validation.middleware.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend routing and dynamic query building infrastructure

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Configure express backend router in `server/src/routes/library.mjs` to register validation middleware on GET `/api/library/books`
- [x] T004 Update the `getBooksList` database service signature in `server/src/services/library.services.mjs` to accept a query filters object
- [x] T005 Update the `getAllBooks` controller in `server/src/controllers/library.controller.mjs` to parse request query parameters and forward them to database service

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multi-Genre and Availability Filtering (Priority: P1) 🎯 MVP

**Goal**: Filter books catalog listing by checking multiple genres and toggling copies in stock.

**Independent Test**: Select Mathematics and Physics tags, check "Available Only", and verify catalog renders correct subset.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create atomic component `GenreTag.tsx` in `client/app/components/atoms/GenreTag.tsx`
- [x] T007 [US1] Modify database query in `server/src/services/library.services.mjs` to construct PostgreSQL array intersection queries `&&` for selected genres and filter by available quantity > 0
- [x] T008 [US1] Handle the `Others` fallback logic in `server/src/services/library.services.mjs` for books not matching standard categories
- [x] T009 [US1] Update catalog listing component `PopularPublishes.tsx` under `client/app/components/organisms/PopularPublishes.tsx` to read genres and availability parameters from URL query string and fetch data from API
- [x] T010 [US1] Update `LibraryPage` routing in `client/app/library/page.tsx` to synchronize state changes with URL query parameter transitions

**Checkpoint**: User Story 1 is functional as an independent MVP.

---

## Phase 4: User Story 2 - Dismissible Filter Panel (Priority: P2)

**Goal**: Open and close the filter layout within a responsive side drawer drawer.

**Independent Test**: Click Filter button, check drawer slides in. Click backdrop or close icon, verify drawer slides back.

### Implementation for User Story 2

- [x] T011 [P] [US2] Create sliding drawer drawer organism component `FilterPanel.tsx` in `client/app/components/organisms/FilterPanel.tsx`
- [x] T012 [US2] Embed `FilterPanel.tsx` inside layout template `HomeLayout.tsx` under `client/app/components/templates/HomeLayout.tsx` and pass drawer state parameters
- [x] T013 [US2] Update `SearchBar.tsx` in `client/app/components/molecules/SearchBar.tsx` to bind toggle event trigger on click of the Filter button
- [x] T014 [US2] Bind click events on close icons and canvas backdrop areas inside `client/app/components/organisms/FilterPanel.tsx` to trigger panel dismissal

**Checkpoint**: User Stories 1 and 2 are fully integrated and functional.

---

## Phase 5: User Story 3 - Location and Publication Year Filtering (Priority: P3)

**Goal**: Filter book listing by campus branch campus locations and publication year range inputs.

**Independent Test**: Select Linh Trung / Nguyen Van Cu branch, specify publication start/end years, and verify result set.

### Implementation for User Story 3

- [x] T015 [P] [US3] Create year selection molecule component `YearRangeFilter.tsx` in `client/app/components/molecules/YearRangeFilter.tsx`
- [x] T016 [US3] Implement validation middleware in `server/src/middlewares/validation.middleware.mjs` rejecting request with 400 when startYear > endYear
- [x] T017 [US3] Extend database service query in `server/src/services/library.services.mjs` to filter library table branch joins and book table publication years
- [x] T018 [US3] Integrate branch checkbox inputs and `YearRangeFilter.tsx` component into the side drawer `client/app/components/organisms/FilterPanel.tsx`
- [x] T019 [US3] Bind branch and date parameter mutations inside `client/app/components/organisms/FilterPanel.tsx` to serialize state changes into URL query strings

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Dynamic UI optimizations and end-to-end flow checks

- [x] T020 [P] Implement input debouncing (300ms) inside `client/app/components/organisms/FilterPanel.tsx` to debounce API request calls during fast user interactions
- [x] T021 Update library catalog container `client/app/components/organisms/PopularPublishes.tsx` to present a user-friendly fallback state when searches yield zero results
- [x] T022 Run quickstart validation checks using `cURL` commands as listed in `specs/009-book-filter-panel/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (P1) is the MVP and should be completed first.
  - User Story 2 (P2) and User Story 3 (P3) can proceed in parallel once foundational APIs are ready.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- GenreTag component creation (`T006`), FilterPanel slide skeleton (`T011`), and YearRangeFilter component (`T015`) can be constructed in parallel.
- Endpoint validation logic `T016` can be implemented concurrently with UI updates.
