# Feature Specification: AI Recommendation for Login Users

**Feature Branch**: `027-ai-user-recommendations`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "AI recommendation for login users, enhance the book shown in recommendation dashboard. Read database/Init_data/GraphSAGE.py and database/Init_data/LightGBM.py to understand the training flow, you can modify and move these files if needed. The recommendations should rely on user behaviours like searching, wishlist, borrowed... Remember to support the renew for recommendations, exclude the borrowed book and wishlist book from user recommendation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Personalized Recommendations on User Dashboard (Priority: P1)

As a logged-in library user, I want to see personalized book recommendations in the "Based on your reading history" section of my recommendation dashboard, so that I can easily discover books tailored to my tastes.

**Why this priority**: Personalized recommendations are the core value of this feature, driving engagement by presenting books that align with the user's past behaviors.

**Independent Test**: Can be tested by logging in as a user with existing search, wishlist, or borrow history, navigating to the recommendation dashboard, and verifying that the "Based on your reading history" section displays a carousel populated with personalized books rather than random books.

**Acceptance Scenarios**:

1. **Given** a logged-in user with a history of searches, wishlist additions, or borrowed books, **When** they visit the recommendation dashboard page, **Then** they see a carousel of book cards in the "Based on your reading history" section.
2. **Given** the recommendation carousel is loaded, **When** the user inspects the displayed books, **Then** none of the books are currently in the user's wishlist or currently/historically borrowed by the user.
3. **Given** a new logged-in user with no behavioral history, **When** they visit the recommendation dashboard page, **Then** they see a placeholder suggestion message or a fallback list of highly rated/popular books in the personalized section.

---

### User Story 2 - Renew Personalized Recommendations (Priority: P2)

As a logged-in library user, I want to renew/refresh my personalized recommendations, so that I can get a fresh set of suggestions based on my latest activity.

**Why this priority**: User interests change, and recommendations can become stale. Giving users control to refresh their recommendations ensures the feed remains relevant and interactive.

**Independent Test**: Can be tested by clicking the "Renew Recommendations" button on the dashboard and verifying that the carousel displays a loading indicator, and then refreshes with a different set of books.

**Acceptance Scenarios**:

1. **Given** a logged-in user is viewing their recommendation dashboard, **When** they click the "Renew Recommendations" button, **Then** the interface displays a visual loading state.
2. **Given** the renewal request is processed, **When** the dashboard updates, **Then** the previous recommendations are archived/hidden, and a fresh set of recommended books is displayed.

---

### User Story 3 - Track Recommendation Interaction (Priority: P2)

As a library member, I want the system to track my clicks on recommended books, so that future recommendations are dynamically refined based on what I choose to look at.

**Why this priority**: Tracking clicks closes the feedback loop, allowing the machine learning models (LightGBM and GraphSAGE) to learn from user actions and improve future recommendations.

**Independent Test**: Can be tested by clicking a recommended book card, verifying it opens the book details, and checking that the click event is recorded in the database.

**Acceptance Scenarios**:

1. **Given** a user is viewing a recommended book card, **When** they click on the book card, **Then** they are navigated to the book's detail page.
2. **Given** a user clicks a recommended book card, **When** the navigation completes, **Then** the recommendation interaction is saved as a click event in the database.

---

### User Story 4 - View Trending Recommendations (Priority: P2)

As a logged-in library user, I want to see trending books in the "Trending this week" section of my dashboard, so that I can see what is popular in the library system.

**Why this priority**: Trending recommendations provide a secondary discovery path for popular books across the entire library network while respecting user boundaries (excluding books the user has already read or wishlisted).

**Independent Test**: Can be tested by navigating to the recommendation dashboard and verifying that the "Trending this week" carousel displays books that have high aggregate interactions from all users.

**Acceptance Scenarios**:

1. **Given** a logged-in user is on the recommendation dashboard, **When** they scroll to the "Trending this week" section, **Then** they see a carousel of book cards representing popular library-wide books.
2. **Given** the trending carousel is loaded, **When** the user views the items, **Then** any books currently in the user's wishlist or borrowed by the user are excluded from this carousel.

---

### Edge Cases

- **Cold Start (No History)**: If a user has no search history, wishlist items, or borrow records, the personalized recommendation system will default to displaying popular or highly rated books. A helpful tip is shown: *"Add books to your wishlist or search the catalog to get personalized recommendations!"*
- **Offline Graph Database / ML Service**: If the Memgraph graph database or the recommendation ranking service is offline, the backend API will fall back to returning popular/highly rated books from PostgreSQL. The dashboard remains fully functional with a fallback list, and a warning is logged in the system backend.
- **Extreme User Activity (Exhausted Catalog)**: If a user has already wishlisted or borrowed almost all books in a genre or catalog, the system will lift the exclusion constraint on historically borrowed/returned books to ensure the recommendation carousel does not appear empty, while keeping active wishlist items and current borrows excluded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST generate personalized book recommendations for authenticated logged-in users.
- **FR-002**: Personalized recommendations MUST be derived from user behaviors including search history queries and clicked search results (`search_history` table), wishlist additions (`user_wishlist` table), and borrow/return actions (`borrow_book` and `return_book` tables).
- **FR-003**: The personalized recommendation engine MUST exclude books that are currently in the user's wishlist or currently/historically borrowed or reserved by the user.
- **FR-004**: The system MUST support a "Renew Recommendations" (or "Refresh") action. This action MUST:
  - Invalidate/archive the user's active recommendations in the database (by setting `renewed_at = CURRENT_TIMESTAMP`).
  - Request the recommendation service to generate a fresh candidate list of books.
  - Store the new active recommendations in PostgreSQL with the generated score, `showed_at = CURRENT_TIMESTAMP`, `is_clicked = false`, and `renewed_at = NULL`.
- **FR-005**: When a user clicks a recommended book, the system MUST record the interaction by updating the recommendation record (setting `is_clicked = true` and `renewed_at = CURRENT_TIMESTAMP`) in PostgreSQL and syncing the updated state to Memgraph.
- **FR-006**: The system MUST expose backend API endpoints:
  - `GET /api/dashboard/user/recommendations` to fetch active personalized ("Based on your reading history") and trending ("Trending this week") recommendations.
  - `POST /api/dashboard/user/recommendations/renew` to trigger recommendation renewal/regeneration.
  - `POST /api/dashboard/user/recommendations/:bookId/click` to log a click on a recommended book.
- **FR-007**: The recommendation training pipeline files (`GraphSAGE.py` and `LightGBM.py`) MUST be consolidated into a structured backend service area (e.g. `server/src/recommendation/` or `database/Init_data/` with clear triggers) and support automated periodic retraining of models (e.g., via background scheduler or cron jobs).
- **FR-008**: The recommendation dashboard interface MUST contain a "Renew Recommendations" button that triggers the renewal API and updates the carousel display.

### Key Entities *(include if feature involves data)*

- **Book**: Represents a catalog resource in the library. Key properties used for recommendations include book ID, title, authors, genres, and semantic embeddings (384-dimensional vector features).
- **User**: Represents a library reader. Key properties include user ID, username, and interactions.
- **Recommendation Log**: Represents a record of a book recommended to a user. Stored in the `recommends` table with attributes:
  - `user_id`: Unique identifier of the user (FK to `users`).
  - `book_id`: Unique identifier of the recommended book (FK to `books`).
  - `score`: Probability or ranking score generated by the ML model.
  - `showed_at`: Timestamp when the recommendation was generated/displayed.
  - `is_clicked`: Boolean indicating if the user clicked the recommendation.
  - `renewed_at`: Timestamp indicating when the recommendation was renewed (archived) or clicked.
- **User Behaviors**:
  - `search_history` (User searches and clicked books)
  - `user_wishlist` (User wishlisted books)
  - `borrow_book` (User active or past borrows)
  - `return_book` (User returned books)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The recommendation dashboard loads and returns recommendations in under 1.5 seconds.
- **SC-002**: Under normal conditions, 100% of books currently in the user's wishlist or active/past borrows are successfully excluded from the recommendation list.
- **SC-003**: The "Renew Recommendations" operation completes and refreshes the dashboard in under 3.0 seconds.
- **SC-004**: Recommendation click-through logs are synchronized between PostgreSQL and Memgraph asynchronously in under 500ms without blocking frontend navigation or server response times.

## Assumptions

- The GraphSAGE model on Memgraph and the LightGBM ranker model are retrained regularly (e.g., daily or weekly) to update embeddings and weights.
- The PostgreSQL database has the `recommends` table defined to store generated recommendations, click tracking, and renewal states.
- The Node.js Express backend and the Next.js frontend will use the established API pathing and standard components (such as carousels) for rendering.
- The book embedding vectors are pre-computed and stored in the database (`books.embedding`).
