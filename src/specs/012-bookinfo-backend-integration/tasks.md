# Tasks: Book Information Backend Integration

**Input**: Design documents from `specs/012-bookinfo-backend-integration/`

**Prerequisites**: plan.md, spec.md

**Organization**: Tasks grouped by implementation phase; all tasks are already completed natively.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Backend Library API Routes

**Purpose**: Expose REST endpoints for library data.

- [X] T001 [P] Create `src/server/src/routes/library.mjs` router.
- [X] T002 Implement `GET /api/library/books` route and map to `getAllBooks` controller.
- [X] T003 Implement `GET /api/library/books/:id` route and map to `getBookDetails`.
- [X] T004 Implement `GET /api/library/books/:id/recommendations` route and map to `getBookRecommendations`.
- [X] T005 Implement `POST /api/library/reserve` route and map to `reserveBook`.

**Checkpoint**: Endpoints are available and return expected JSON payloads.

---

## Phase 2: Home Page Catalog Integration (US1)

**Purpose**: Fetch and display dynamic book lists on the home page.

- [X] T006 [US1] Add `"use client"` directive to `src/client/app/components/organisms/PopularPublishes.tsx`.
- [X] T007 [US1] Initialize `books`, `currentPage`, `totalPages`, and `loading` states.
- [X] T008 [US1] Create `fetchBooks` async function in a `useEffect` hooked to `currentPage`.
- [X] T009 [US1] Render mapping of `BookCard` components from `books` array.
- [X] T010 [US1] Add loading UI and empty state fallback.
- [X] T011 [US1] Implement pagination controls (Next, Prev, Page Numbers).

**Checkpoint**: Home page displays books from the database with working pagination.

---

## Phase 3: Book Details Page Integration (US2, US3)

**Purpose**: Fetch single book details, recommendations, and handle reservations.

- [X] T012 [US2] Update `src/client/app/library/[id]/page.tsx` to use `useParams()` to get the book `id`.
- [X] T013 [US2] Initialize `book`, `recommendations`, `loading`, `isReserving`, and `reserved` states.
- [X] T014 [US2] Implement `Promise.all` inside `useEffect` to fetch book details and recommendations simultaneously.
- [X] T015 [US3] Create `handleReserve` function firing `POST /api/library/reserve` with hardcoded `userId`.
- [X] T016 [US3] Re-fetch book details upon successful reservation.
- [X] T017 [US2] Pass all props (`book`, `recommendations`, `loading`, `isReserving`, `reserved`, `onReserve`) to `BookDetailTemplate`.

**Checkpoint**: Book detail page successfully renders data and supports reservation interactions.

---

## Technical Debt / Future Work
- [ ] T018 Refactor `handleReserve` to use the actual `userId` from the global authentication context instead of the hardcoded `'user_123'`.
