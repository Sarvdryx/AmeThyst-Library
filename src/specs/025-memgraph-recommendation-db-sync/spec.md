# Feature Specification: Memgraph Recommendation DB Synchronization

**Feature Branch**: `024-memgraph-recommendation-db-sync`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "i am building memgraph database as can be seen in InitGraph and  memgraphSync.services. The db will be used in future recommendation. the data in graph should include the books information (along with embedded features) with nodes like genres, authors ; users, search_history, user_wishlist and recommends. The db should be synchronized correctly when the PostgreSQL is updated."

## Clarifications

### Session 2026-07-08
- Q: Will we combine the Memgraph schema initialization and baseline database ingestion step with the runtime database synchronization step, or process them as separate components? → A: Combined processes: On backend service startup, the system automatically checks for Memgraph constraints and baseline data, initializing the schema and seeding if empty, and then begins listening for sync updates.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Graph Ingestion & Schema Initialization (Priority: P1)

As a system administrator, I want the system to automatically initialize the Memgraph database schema and import all baseline data (including Books with embedded features, Authors, Genres, Users, Search History, User Wishlists, and Recommendation logs) on server startup if the graph is empty, so that the recommendation system has a complete and accurate initial graph representation of the library ecosystem.

**Why this priority**: This is the foundational capability. Graph-based recommendation algorithms rely on historical relationships (wishlists, past searches, and recommendations) to generate initial recommendations and avoid cold start issues.

**Independent Test**: Can be fully verified by starting the application server and asserting that the initialized graph contains the correct count of nodes and relationships for all entities (e.g., Books, Genres, Authors, Users, Wishlist edges, Recommendation edges, and Search logs) without errors.

**Acceptance Scenarios**:

1. **Given** an empty Memgraph instance and valid baseline export data, **When** the backend service starts up, **Then** all nodes (Book, User, Branch, Genre, Author) are successfully created, and their constraints and unique indexes are correctly established.
2. **Given** baseline data containing users, wishlists, search clicks, and recommendation histories, **When** the graph initialization completes automatically on startup, **Then** the corresponding `WISHLISTED`, `SEARCHED`, and `RECOMMENDED` relationships are established between the appropriate `User` and `Book` nodes.

---

### User Story 2 - Real-Time Synchronization of User Wishlist Actions (Priority: P2)

As a library member, I want my wishlist actions (adding a book to my wishlist or removing it) to be synchronized with the graph database in real-time, so that future recommendations immediately adapt to my current preferences.

**Why this priority**: Keeping wishlist actions synced is critical for active user preferences. Wishlist additions indicate a strong positive signal, while removals represent changes in interest.

**Independent Test**: Perform wishlist additions and removals through the application interface and verify that corresponding `WISHLISTED` relationships in Memgraph are immediately created or deleted.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they add a book to their wishlist, **Then** a `WISHLISTED` relationship with the property `added_at` is created between the user's node and the book's node in Memgraph.
2. **Given** a book is on a user's wishlist, **When** they remove the book from their wishlist, **Then** the corresponding `WISHLISTED` relationship is deleted in Memgraph.

---

### User Story 3 - Synchronization of System Recommendations and User Interactions (Priority: P2)

As a library member, I want system-generated recommendations and my clicks on those recommendations to be synchronized between the primary database and the graph database, so that the system can track recommendation effectiveness and update future suggestion paths.

**Why this priority**: Tracking which recommendations are shown and clicked forms the feedback loop necessary for refining the recommendation engine's accuracy and avoiding repeat recommendations.

**Independent Test**: Generate a set of recommendations for a user and simulate a click event, verifying that the `RECOMMENDED` relationships are created and updated with the correct `is_clicked` property value in the graph.

**Acceptance Scenarios**:

1. **Given** a set of recommendations is generated and saved for a user in the primary database, **When** the synchronization is triggered, **Then** `RECOMMENDED` relationships are created in Memgraph between the User node and the Book nodes with `is_clicked = false`.
2. **Given** a user is displayed a recommendation, **When** they click on the recommended book, **Then** the corresponding `RECOMMENDED` relationship in Memgraph is updated to set `is_clicked = true` and `renewed_at = [current_timestamp]`.

---

### User Story 4 - Real-Time Search History Syncing (Priority: P3)

As a library member, I want my search history queries and clicked search results to be tracked in the graph database, so that the recommendation system can capture my search context and semantic intent.

**Why this priority**: Search logs capture transient intent and immediate interest. However, search clicks are lower-priority signals compared to explicit wishlist additions.

**Independent Test**: Execute a search query and click on a book in the search results, then verify that a `SEARCHED` relationship exists between the User and Book nodes containing the query text and timestamp.

**Acceptance Scenarios**:

1. **Given** a user performs a search and clicks a book result, **When** the event is persisted, **Then** a `SEARCHED` relationship is created between the User node and the Book node in Memgraph containing `search_id`, `created_at`, and `query`.

---

### Edge Cases

- **Graph Database Offline**: When the Memgraph service is down or unreachable during a user action (e.g., adding to wishlist), the primary database operation (PostgreSQL) MUST succeed without blocking the user, and the sync event must be logged or queued for retry.
- **Reference to Non-Existent Nodes**: If a synchronization event references a User or Book that does not exist in Memgraph (e.g., a newly registered user who has not been synced), the synchronization task must gracefully handle it by creating the missing node first with placeholder data.
- **Duplicate Synchronization Events**: If a synchronization event is retried and dispatched multiple times, the graph database operations must be idempotent (using Cypher `MERGE` queries) to avoid duplicate edges or duplicate property states.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST automatically check and initialize the Memgraph database schema and populate it with baseline data (including Book, User, Branch, Genre, Author, and relationship edges) on backend service startup if the graph is empty.
- **FR-002**: When a user adds a book to their wishlist in PostgreSQL, the system MUST create a `WISHLISTED` relationship between the matching `User` and `Book` nodes in Memgraph with an `added_at` timestamp.
- **FR-003**: When a user removes a book from their wishlist in PostgreSQL, the system MUST delete the corresponding `WISHLISTED` relationship in Memgraph.
- **FR-004**: When recommendations are generated and stored in PostgreSQL, the system MUST create `RECOMMENDED` relationships in Memgraph from the `User` to the `Book` nodes, default-setting `is_clicked` to `false` and recording the `showed_at` timestamp.
- **FR-005**: When a recommendation is marked as clicked in PostgreSQL, the system MUST update the corresponding `RECOMMENDED` relationship in Memgraph to set `is_clicked = true` and update the `renewed_at` timestamp.
- **FR-006**: When a new search click history entry is saved in PostgreSQL, the system MUST create a `SEARCHED` relationship in Memgraph between the `User` and `Book` nodes, capturing `query` and `created_at` parameters.
- **FR-007**: Graph synchronization operations MUST NOT block PostgreSQL database transactions or client response cycles (i.e., sync tasks must run asynchronously or handle failures gracefully).
- **FR-008**: All graph-writing Cypher queries MUST be idempotent to prevent duplicate relationships or incorrect property accumulation upon event retries.

### Key Entities *(include if feature involves data)*

- **Book**: Represents a catalog resource in the library. Key properties in the graph include `id` (matching PostgreSQL `book_id`), `title`, `description`, `publication`, `num_pages`, `rating`, `language_code`, and `embedding` (array of floating-point features representing vector representations of the book's contents).
- **Genre**: Represents a category or subject classification for books. Connected to `Book` via `[:HAS_GENRE]` relationship.
- **Author**: Represents the writer of a book. Connected to `Book` via `[:WRITTEN_BY]` relationship.
- **User**: Represents a registered library reader. Key properties include `id` (matching PostgreSQL `user_id`), `username`, `role`, and `features` (user feature vectors derived for recommendations).
- **UserWishlist (Relationship)**: Modeled as `[:WISHLISTED]` relationship connecting `User` to `Book` with property `added_at`.
- **SearchHistory (Relationship)**: Modeled as `[:SEARCHED]` relationship connecting `User` to `Book` with properties `search_id`, `created_at`, and `query`.
- **Recommends (Relationship)**: Modeled as `[:RECOMMENDED]` relationship connecting `User` to `Book` with properties `showed_at`, `is_clicked`, and `renewed_at`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of wishlist additions/removals and recommendation click updates successfully sync from PostgreSQL to Memgraph under healthy service conditions.
- **SC-002**: Database synchronization calls execute in the background with zero (0ms) added blocking latency on user-facing API response times.
- **SC-003**: Synchronization recovery processes can re-align Memgraph graph data with PostgreSQL within 5 minutes after a connection failure is resolved.
- **SC-004**: Automatic Memgraph schema initialization and baseline data seeding on server startup runs to completion in under 30 seconds for standard baseline datasets.

## Assumptions

- PostgreSQL remains the authoritative source of truth for all library records; Memgraph's graph database is a secondary cache/accelerator used strictly for graph-based recommendations.
- Book embedding vectors (features) are generated by a transformer service when the book is added to PostgreSQL and are readily available to be synced to the graph.
- The Node.js Express backend service layer (`memgraphSync.services.mjs`) is responsible for dispatching updates to Memgraph when corresponding database changes occur in PostgreSQL.
