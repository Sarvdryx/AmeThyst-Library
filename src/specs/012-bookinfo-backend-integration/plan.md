# Implementation Plan: Book Information Backend Integration

**Branch**: `012-bookinfo-backend-integration` | **Date**: 2026-06-23 | **Spec**: [specs/012-bookinfo-backend-integration/spec.md](spec.md)

**Input**: Feature specification from `spec.md`. This plan was reverse-engineered from ad-hoc implementation.

## Summary

Build and integrate the backend Express.js routes for the library catalog and connect the Next.js frontend components (`PopularPublishes.tsx` and `library/[id]/page.tsx`) to these endpoints. The integration replaces static/mock data with real-time fetching via the native `fetch` API, incorporating loading states, pagination, and parallel fetching for performance.

## Technical Context

**Language/Version**: JavaScript ES modules (Node.js 18+), TypeScript/JSX for Next.js client.

**Primary Dependencies**:
- Server: `express`
- Client: Next.js App Router, React 19 (`useState`, `useEffect`, `useParams`)

**Architecture**: MVC on backend (routes → controllers) and Component-based on frontend.

**Scale/Scope**: 4 API endpoints + 2 Frontend Pages/Components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Component-Driven & Reusability**: `BookDetailTemplate` and `BookCard` components are utilized cleanly to separate UI from data fetching logic.
- [x] **II. State Management**: `loading`, `isReserving`, `books`, and `recommendations` states are managed explicitly inside client components.
- [x] **III. Responsive & Beautiful Design**: Maintained existing UI tokens; added skeleton/loading text placeholders.
- [x] **IV. Performance Optimization**: Used `Promise.all` in `[id]/page.tsx` to fetch book details and recommendations concurrently.
- [x] **V. Error Handling & Accessibility**: Graceful fallback for empty book lists; try-catch blocks applied around async fetch calls.

## Project Structure

### Documentation (this feature)

```text
specs/012-bookinfo-backend-integration/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code

```text
src/server/
├── src/
│   ├── controllers/
│   │   └── library.controller.mjs     # Backend logic for library
│   ├── routes/
│   │   └── library.mjs                # Mounted endpoints
│   └── server.mjs

src/client/app/
├── components/
│   ├── organisms/
│   │   └── PopularPublishes.tsx       # Home page catalog grid
├── library/
│   └── [id]/
│       └── page.tsx                   # Book details cover page
```

## Implementation Phases (Execution Order)

### Phase 1 — Backend Library API Routes

1. Create `library.mjs` router in `src/server/src/routes`.
2. Define `GET /api/library/books` for catalog fetching.
3. Define `GET /api/library/books/:id` for specific book details.
4. Define `GET /api/library/books/:id/recommendations` for related books.
5. Define `POST /api/library/reserve` for book reservations.
6. Connect routes to the corresponding functions in `library.controller.mjs`.

### Phase 2 — Home Page Catalog Integration (`PopularPublishes.tsx`)

1. Convert `PopularPublishes` to a client component (`"use client"`).
2. Set up `useState` for `books`, `currentPage`, `totalPages`, and `loading`.
3. Implement `useEffect` to fetch data from `NEXT_PUBLIC_API_URL/api/library/books?page=X&limit=24`.
4. Render `BookCard` components dynamically based on fetched data.
5. Implement pagination UI logic that updates `currentPage`.

### Phase 3 — Book Details Page Integration (`[id]/page.tsx`)

1. Set up dynamic routing by extracting `id` using `useParams()`.
2. Initialize state for `book`, `recommendations`, `loading`, `isReserving`, and `reserved`.
3. Implement `useEffect` to trigger a `Promise.all` fetching both the book details and recommendations concurrently.
4. Implement `handleReserve` function to call the `POST /api/library/reserve` endpoint.
5. Pass states and callbacks down to the `BookDetailTemplate` component.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Hardcoded `userId` in Reserve | Authentication context was not fully wired to this component yet. | Wait for global auth state to be finalized; placeholder gets MVP working. |
| Client-side Fetching | Components needed interactivity (pagination/reserve). | React Server Components could be used for initial load, but client-side fetching simplifies pagination state for now. |
