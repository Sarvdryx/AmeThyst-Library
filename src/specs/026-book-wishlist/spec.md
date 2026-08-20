# Feature Specification: Book Wishlist and Dashboard Integration

**Feature Branch**: `026-book-wishlist`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "base on @[specs/007-view-books-details] GUI, add a button (interactive heart icon) for user to save the book to their wishlist. When i click on the heart, it turn to red and notify the successful saving to wishlist. The wishlist data will be updated in postgres (table user_wishlist) and sync to memgraph. The books in wishlist will show up in user dashboard (as in @[specs/010-user-dashboard-recommendation] ) but it occpupy the lower line only, reserve the upper line for recommendations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Book to Wishlist (Priority: P1)

As a logged-in library member, I want to save a book to my wishlist from the book details page so that I can easily keep track of books I plan to read.

**Why this priority**: Core functionality of the wishlist feature; user engagement depends on being able to express interest in specific books.

**Independent Test**: Can be tested by navigating to a book details page, clicking the outlined heart icon, verifying it turns solid red and triggers a success toast, and then verifying the database/graph update.

**Acceptance Scenarios**:

1. **Given** I am a logged-in user on a book details page (`/library/[id]`), **When** the book is not in my wishlist, **Then** I see an outlined (unfilled) heart icon overlaid on the top-right corner of the book cover.
2. **Given** I am viewing the outlined heart icon, **When** I click the heart icon, **Then** the heart icon turns red with a smooth color transition.
3. **Given** I click the heart icon, **When** the operation completes, **Then** I receive a temporary toast notification confirming the book was saved successfully to my wishlist.
4. **Given** a successful wishlist addition, **When** I inspect the database, **Then** a new record is added to PostgreSQL table `user_wishlist` and a corresponding `[:WISHLISTED]` relationship is created in Memgraph.

---

### User Story 2 - Remove Book from Wishlist (Priority: P1)

As a logged-in library member, I want to remove a book from my wishlist by clicking the heart icon again, so that I can keep my list relevant to my current interests.

**Why this priority**: Essential for maintaining an accurate wishlist; users must be able to toggle interest on and off easily.

**Independent Test**: Can be tested by clicking a red heart icon on a book details page, verifying it changes to an outlined heart, triggers a success toast, and deletes the database/graph entries.

**Acceptance Scenarios**:

1. **Given** I am a logged-in user on a book details page, **When** the book is already in my wishlist, **Then** the heart icon renders as solid red.
2. **Given** the solid red heart icon, **When** I click the heart icon, **Then** the icon changes back to its outlined (unfilled) state.
3. **Given** I click the heart icon to remove it, **When** the operation completes, **Then** I receive a temporary toast notification confirming the book was removed from my wishlist.
4. **Given** a successful wishlist removal, **When** I inspect the database, **Then** the corresponding record is deleted from PostgreSQL table `user_wishlist` and the `[:WISHLISTED]` relationship is deleted in Memgraph.

---

### User Story 3 - View Wishlist on Dashboard (Priority: P1)

As a logged-in library member, I want to view my wishlist books on my dashboard recommendations page so that I have quick access to my saved resources.

**Why this priority**: Enhances usability by providing a centralized location for wishlist books and recommendations.

**Independent Test**: Can be tested by navigating to `/dashboard/user/recommendations` and asserting that the lower row displays a carousel of books saved in the wishlist.

**Acceptance Scenarios**:

1. **Given** I am on `/dashboard/user/recommendations`, **When** I have books in my wishlist, **Then** I see the page split into two horizontal carousels.
2. **Given** the split layout, **When** the page loads, **Then** the upper line displays recommended books (e.g. Based on your reading history), and the lower line displays my wishlist books.
3. **Given** the wishlist carousel on the dashboard, **When** I click a book card in the carousel, **Then** I am navigated to that book's details page.
4. **Given** I have no books in my wishlist, **When** I load the dashboard recommendations page, **Then** the lower line displays a friendly fallback message encouraging me to discover and save books.

### Edge Cases

- **Unauthenticated/Visitor User**:
  - Unauthenticated users should still see the heart icon, but clicking it should redirect them to `/login` or show a toast message: "Please sign in to save books to your wishlist".
- **Memgraph Synchronization Failure**:
  - If the Memgraph server is offline or unreachable, the PostgreSQL database operation must still succeed, the UI state must change to red, and a background retry task should handle syncing the `[:WISHLISTED]` relationship later without disrupting the user.
- **Extremely Long Wishlist**:
  - If a user has dozens of books in their wishlist, the dashboard carousel must support pagination/infinite scroll or horizontal navigation arrows without slowing down page load times.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an interactive heart icon on the Book Details page (`/library/[id]`) absolute-positioned on the top-right overlay of the book cover.
- **FR-002**: For logged-in users, the heart icon state MUST reflect their wishlist status on load (filled red if in wishlist, outlined if not).
- **FR-003**: Clicking the heart icon MUST toggle the book's presence in the database:
  - Add to PostgreSQL table `user_wishlist` (if not present) and return success message.
  - Remove from PostgreSQL table `user_wishlist` (if present) and return success message.
- **FR-004**: System MUST sync the wishlist state to Memgraph in real-time (create or delete `[:WISHLISTED]` relationship connecting `User` node to `Book` node).
- **FR-005**: The User Dashboard Recommendations page (`/dashboard/user/recommendations`) MUST be modified to use a two-line layout:
  - Upper line: Recommended Books carousel (e.g., Based on reading history).
  - Lower line: Wishlist Books carousel.
- **FR-006**: Both carousels on the dashboard page MUST display book cards containing cover image, title, and author, and support horizontal scrolling navigation.
- **FR-007**: The wishlist functionality MUST adapt to light and dark modes in compliance with Global Feature Requirements (design tokens and dark utilities).
- **FR-008**: All user-facing text, placeholders, and toast notifications related to the wishlist MUST be localized using English and Vietnamese localization files (`en.json` and `vi.json`).

### Key Entities

- **UserWishlist**: Represents a entry in the user's wishlist.
  - Fields: `wish_id` (UUID, primary key), `user_id` (UUID, foreign key to users), `book_id` (varchar, foreign key to books), `added_at` (timestamp, default current time).
- **WISHLISTED (Relationship)**: Graph relationship in Memgraph connecting `User` to `Book` with property `added_at`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Wishlist toggle click registers and updates UI state (filled/outlined) in under 300ms.
- **SC-002**: Save/remove success toast notifications appear within 400ms of clicking the heart icon.
- **SC-003**: The user dashboard recommendations page (`/dashboard/user/recommendations`) loads and displays both carousels within 1.5 seconds.
- **SC-004**: 100% of user wishlist modifications successfully sync between PostgreSQL and Memgraph under healthy service conditions.

## Assumptions

- **Existing Layout**: The heart icon overlay uses existing CSS styles and Tailwind utility classes for interactive state and hover effects.
- **Consolidated Recommendations**: The upper line of the dashboard recommendation page will display "Based on reading history" recommendations, consolidating the prior two-row recommendation page into a single row to accommodate the wishlist row on the bottom.
- **User Authentication**: The user session is active and provides a valid JWT token to authorize the wishlist add/remove API endpoints.
