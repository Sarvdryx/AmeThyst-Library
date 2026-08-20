# Feature Specification: Book Information Backend Integration

**Feature Branch**: `012-bookinfo-backend-integration`

**Created**: 2026-06-23

**Status**: Implemented (Backfilled)

**Input**: Connect the frontend components (Home page's Popular Publishes and Book Details cover page) to the backend API to fetch real book data and handle book reservations, replacing any previous hardcoded or mock data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Library Catalog (Home Page) (Priority: P1)

As a library user, I want to view a list of popular books on the home page with pagination so that I can discover books to read.

**Independent Test**: Visit the home page, verify that the book grid loads, displays up to 24 books per page, and pagination controls work.

**Acceptance Scenarios**:

1. **Given** the user is on the home page, **When** the `PopularPublishes` component mounts, **Then** it fetches `GET /api/library/books?page=1&limit=24` and displays the books.
2. **Given** the component is fetching data, **When** `loading` is true, **Then** a loading indicator is displayed.
3. **Given** there are multiple pages, **When** the user clicks a pagination number or "Next", **Then** the current page state updates, fetching the respective page of books.
4. **Given** no books are returned, **When** `books.length === 0`, **Then** an empty state message is shown.

---

### User Story 2 - View Book Details (Priority: P1)

As a library user, I want to click on a book and see its detailed information and recommendations for similar books.

**Independent Test**: Click on a book card, navigate to `/library/[id]`, verify that the book details and recommended books load simultaneously.

**Acceptance Scenarios**:

1. **Given** the user navigates to `/library/:id`, **When** the page loads, **Then** it triggers parallel requests to `GET /api/library/books/:id` and `GET /api/library/books/:id/recommendations`.
2. **Given** the data is fetched successfully, **When** the responses are OK, **Then** the `BookDetailTemplate` is rendered with the book details and recommendations list.
3. **Given** data is being fetched, **When** `loading` is true, **Then** the template displays a loading state.

---

### User Story 3 - Reserve a Book (Priority: P2)

As a logged-in user, I want to reserve a book directly from the book details page.

**Independent Test**: Visit a book's detail page, click the "Reserve" button, verify the state updates to reserved.

**Acceptance Scenarios**:

1. **Given** the user is viewing a book detail page, **When** they click "Reserve", **Then** the app sends a `POST /api/library/reserve` request with `userId` and `bookId`.
2. **Given** the reservation request is pending, **When** `isReserving` is true, **Then** the reserve button shows a loading state.
3. **Given** the reservation is successful, **When** the response is OK, **Then** the `reserved` state becomes true and the book details are re-fetched to reflect updated availability.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Backend MUST provide a GET endpoint `/api/library/books` supporting `page` and `limit` queries.
- **FR-002**: Backend MUST provide a GET endpoint `/api/library/books/:id` for specific book details.
- **FR-003**: Backend MUST provide a GET endpoint `/api/library/books/:id/recommendations` to fetch related books.
- **FR-004**: Backend MUST provide a POST endpoint `/api/library/reserve` to handle book reservations.
- **FR-005**: Frontend MUST use `fetch` with `NEXT_PUBLIC_API_URL` to connect to the backend API.
- **FR-006**: Frontend MUST handle loading states gracefully during data fetching.
- **FR-007**: Frontend MUST execute independent API requests (details & recommendations) in parallel using `Promise.all` for performance.

### Key Entities

- **Book**: `id`, `title`, `author`, `coverImage`
- **BookDetails**: Extended Book entity with description, availability, and metadata.
- **Reservation Request**: `{ userId, bookId }`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Home page loads book list and paginates successfully without errors.
- **SC-002**: Book details page successfully displays the specific book and its recommendations in a single load cycle.
- **SC-003**: Users can reserve a book, and the UI immediately reflects the reserved status.
- **SC-004**: No hardcoded mock books exist in the production components.

## Assumptions

- The backend controllers (`library.controller.mjs`) are properly connected to the database.
- Next.js runs on a client environment where `process.env.NEXT_PUBLIC_API_URL` is configured.
- (Technical Debt) The reservation flow currently uses a hardcoded `userId: 'user_123'`, which will need to be replaced with the actual logged-in user's ID from the Auth context in the future.
