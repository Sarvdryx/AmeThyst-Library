# Tasks: View Book Details

**Input**: Design documents from `specs/007-view-books-details/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [x] T001 Create page directory in `client/app/library/[id]/`
- [x] T002 Initialize empty component files for atoms, molecules, and organisms per implementation plan
- [x] T003 [P] Configure `NEXT_PUBLIC_API_URL` in `client/.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure and base models

- [x] T004 Create Book and Inventory schema definitions in `server/src/models/library.models.mjs`
- [x] T005 [P] Setup basic route in `server/src/routes/library.mjs` and link to `server/src/server.mjs`
- [x] T006 [P] Implement base service methods for data fetching in `server/src/services/library.services.mjs`
- [x] T007 [P] Implement base controller logic in `server/src/controllers/library.controller.mjs`

**Checkpoint**: Foundation ready - backend structure is in place for specific feature implementation.

---

## Phase 3: User Story 1 - View Comprehensive Book Information (Priority: P1) 🎯 MVP

**Goal**: Display title, author, description, and metadata (ISBN, Language).

**Independent Test**: Navigate to `/library/1` and verify book metadata matches the expected mock data.

### Implementation for User Story 1

- [x] T008 [P] [US1] Create `Badge` atom in `client/app/components/atoms/Badge.tsx`
- [x] T009 [P] [US1] Create `InfoGridItem` molecule in `client/app/components/molecules/InfoGridItem.tsx`
- [x] T010 [P] [US1] Implement `GET /api/library/books/:id` logic for book metadata in `server/src/services/library.services.mjs`
- [x] T011 [US1] Create `BookDetailHero` organism in `client/app/components/organisms/BookDetailHero.tsx` using `next/image`
- [x] T012 [US1] Assemble metadata view in `client/app/library/[id]/page.tsx` using `BookDetailHero` and `InfoGridItem`
- [x] T013 [US1] Add responsive Grid layout for book cover and details in `client/app/library/[id]/page.tsx`

**Checkpoint**: User Story 1 is functional - metadata is visible and layout is responsive.

---

## Phase 4: User Story 2 - Check Real-time Availability and Location (Priority: P1)

**Goal**: Display Location, Address, Shelf, and real-time copy count.

**Independent Test**: Verify location details and copy count on the details page match the inventory record.

### Implementation for User Story 2

- [x] T014 [P] [US2] Update `Inventory` model logic in `server/src/models/library.models.mjs` to include location fields
- [x] T015 [P] [US2] Create `StatusBanner` molecule in `client/app/components/molecules/StatusBanner.tsx`
- [x] T016 [US2] Extend `GET /api/library/books/:id` response to include inventory/location in `server/src/controllers/library.controller.mjs`
- [x] T017 [US2] Integrate `StatusBanner` and location metadata into `client/app/library/[id]/page.tsx`

**Checkpoint**: User Story 2 is functional - availability and physical location are displayed.

---

## Phase 5: User Story 3 - Reserve Book for Pickup (Priority: P2)

**Goal**: Enable users to reserve a book and update availability status.

**Independent Test**: Click "Reserve for Pickup", verify copy count decreases, and success message appears.

### Implementation for User Story 3

- [x] T018 [P] [US3] Create `ActionButton` atom in `client/app/components/atoms/ActionButton.tsx`
- [x] T019 [P] [US3] Define `Reservation` model/logic in `server/src/models/library.models.mjs`
- [x] T020 [US3] Implement `POST /api/library/reserve` endpoint in `server/src/routes/library.mjs`
- [x] T021 [US3] Implement reservation business logic in `server/src/services/library.services.mjs`
- [x] T022 [US3] Add "Reserve" action button to `client/app/library/[id]/page.tsx`
- [x] T023 [US3] Add client-side state handling for reservation success/failure in `client/app/library/[id]/page.tsx`

**Checkpoint**: User Story 3 is functional - reservations can be made and status updates live.

---

## Phase 6: User Story 4 - Discovery via Recommendations (Priority: P3)

**Goal**: Display a horizontal scroll of related books.

**Independent Test**: Verify at least 5 related books are visible in the carousel at the bottom of the page.

### Implementation for User Story 4

- [x] T024 [P] [US4] Implement `GET /api/library/books/:id/recommendations` in `server/src/routes/library.mjs`
- [x] T025 [P] [US4] Implement recommendation logic (filter by category) in `server/src/services/library.services.mjs`
- [x] T026 [US4] Create `RecommendationCarousel` organism in `client/app/components/organisms/RecommendationCarousel.tsx`
- [x] T027 [US4] Integrate `RecommendationCarousel` into the bottom of `client/app/library/[id]/page.tsx`

**Checkpoint**: All user stories functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final UI refinements and validation

- [x] T028 Refactor remaining absolute positioning from `ViewBookInfo-layout.txt` to Flex/Grid
- [x] T029 Apply consistent Inter/Manrope typography and #F8EFE6 background across the page
- [x] T030 [P] Ensure all images have appropriate `alt` text and `priority` flags for LCP
- [x] T031 Run validation scenarios in `quickstart.md`
