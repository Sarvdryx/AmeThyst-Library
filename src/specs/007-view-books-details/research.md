# Research: View Book Details Implementation

## UI Architecture & Components

### Existing Components to Reuse:
- **Organisms**: `NavBar.tsx`, `Footer.tsx`.
- **Molecules**: `BookCard.tsx` (for the "You May Also Like" section).

### New Components to Create (Atomic Design):
- **Atoms**:
    - `Badge.tsx`: For the "Available" status.
    - `ActionButton.tsx`: Reusable button for "Reserve" and "Wishlist".
- **Molecules**:
    - `InfoGridItem.tsx`: Individual entries for ISBN, Language, etc.
    - `StatusBanner.tsx`: Combines availability status and copy count.
- **Organisms**:
    - `BookDetailHero.tsx`: Main section with cover image, title, author, and description.
    - `RecommendationCarousel.tsx`: Horizontal scrollable list of `BookCard`s.

## Backend API Design

Based on the Layered Architecture requirement, new logic will be added to the `server/src` directory.

### Proposed Endpoints:
- `GET /api/library/books/:id`:
    - Returns: Book details, description, and physical location metadata.
- `GET /api/library/books/:id/recommendations`:
    - Returns: Array of 5 related books (same category/author).
- `POST /api/library/reserve`:
    - Payload: `{ userId, bookId }`
    - Returns: Success/Error status.

## Data Layer Considerations

The current backend lacks a database connection. Implementation will include:
1.  **Service Layer**: Logic for calculating available copies and validating reservation eligibility.
2.  **Mock Repository**: Initial implementation will use a JSON-based data store until PostgreSQL is configured.

## UI/UX & Responsive Strategy

The provided `ViewBookInfo-layout.txt` uses absolute positioning (e.g., `absolute left-[617px] top-[164px]`). This must be refactored to:
- **Flexbox**: For the header navigation and footer.
- **Grid (2 Columns)**: For the main content (Cover image | Book Details).
- **Responsive Breakpoints**:
    - **Desktop**: 2 columns (Cover 40%, Content 60%).
    - **Mobile**: Stacked (Cover top, Content bottom).
- **Typography**: Inter (primary), font-bold for headings.
- **Colors**: Background `#F8EFE6`, Primary Text `#091426`, Secondary Text `#45474C`, Teal Accent `#006F66`.

## Decision Log

- **Decision**: Use `next/image` for all book covers.
- **Rationale**: Required by `constitution.md` for performance and CLS prevention.
- **Decision**: Implement a client-side horizontal scroll for recommendations.
- **Rationale**: Simpler than full carousel libraries and maintains performance.
