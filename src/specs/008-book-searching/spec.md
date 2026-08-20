# Feature Specification: Book Searching

**Feature Branch**: `feature/DualModeSearching`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "since the failure in handling typo in separate search, we integrate 2 modes into 1 hybrid search: when a user hits search, execute an exact text keyword match simultaneously. The searching backend will be typo-tolerance (thanks to help of trigram in postgres) and reranking the answer (with reciprocal rank fusion). (Text Path): A regex filter identifies misspelled connector strings and strips them out, separating the remaining fragments into standalone parameters + (Semantic Path): The raw query string is sent to your local transformer model (all-MiniLM-L6-v2). The database engine targets indexed columns, pg_trgm GIN index, it slices the strings into 3-character blocks to calculate structural spelling overlaps (typo tolerance) while the pgvector extension uses an HNSW graph index to evaluate the embedding column."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hybrid Search (Priority: P1)

As a library member, I want to search for books by entering a single search query (which can contain metadata keywords, typos, or plot descriptions) and have the system return a unified list of highly relevant results sorted by overall similarity, so that I can easily discover books without manually toggling between standard and semantic search modes.

**Why this priority**: Fundamental search mechanism of the library catalog. By executing keyword matching, trigram-based typo tolerance, and semantic search simultaneously, users get the best of all search modes in one click.

**Independent Test**: Can be tested by entering a query with a typo (e.g., "Hary Poter"), a plot description (e.g., "boy wizard battles dark lord"), or exact metadata (e.g., "J.K. Rowling") on the catalog search bar, and verifying that the catalog grid updates in-place to display the most relevant books at the top.

**Acceptance Scenarios**:
1. **Given** I am on the Library page, **When** I type a search query in the search bar and hit Enter (or click search), **Then** the search executes both exact keyword matching (on title, author, isbn, publisher), trigram-based typo-tolerant matching, and pgvector semantic matching simultaneously, returning the combined results sorted using Reciprocal Rank Fusion.
2. **Given** a query with misspelled connector strings (e.g. "and", "or", "the" misspelled or misplaced), **When** I submit the query, **Then** the backend regex filter strips out those connector fragments, splits the remaining fragments into standalone parameters, and processes the search.

---

### User Story 2 - Metadata Filtering in Hybrid Search (Priority: P2)

As a library user, I want to refine the unified hybrid search results using specific metadata filters (genres, publication year range, page count, and languages) so that I can narrow down my search to a precise subset of books.

**Why this priority**: Essential for filtering down results, particularly when the semantic or typo-tolerant matching returns broad candidates.

**Independent Test**: Perform a hybrid search for "dystopian society", open the filter panel, select the genre "Science Fiction" and language "English", and verify that the results list updates in-place to only show books matching those filter criteria.

**Acceptance Scenarios**:
1. **Given** a list of hybrid search results displayed in-place on the catalog page, **When** I select filters (Genres, Year Range, Page Count, Languages) in the filter panel, **Then** the catalog grid updates in-place to only show books that satisfy all selected metadata filter conditions.
2. **Given** that filters are applied, **When** I clear the filters, **Then** the full unfiltered hybrid search results are restored.

---

### User Story 3 - Clear Response for No Matches (Priority: P1)

As a library member, when my hybrid search query or filter combination returns zero results, I want to see a clear message indicating no matches were found along with search tips, so that I understand no books matched my criteria.

**Why this priority**: Essential for user experience to avoid confusing a zero-result state with application lag or failure.

**Independent Test**: Enter a search query with random gibberish (e.g., "qwertyuiopasdfg") and verify that a clear "No books found matching your request" message is displayed in the catalog grid.

**Acceptance Scenarios**:
1. **Given** a query or filter combination that matches no books, **When** the search is run, **Then** the catalog grid displays a clean "No books found matching your request." message along with suggestions (e.g., "Check spelling", "Remove filters").

---

### User Story 4 - Debounced Search vs. Intent History Logging (Priority: P2)

As a logged-in library member, I want my search interactions to be logged to my profile for personalization, but I want to prevent transient, character-by-character keystrokes from polluting my search history.

**Why this priority**: Search logs are critical for personalization, but logging every keystroke during debounced typing creates database bloat and inaccurate user history.

**Independent Test**: 
1. Type "hobbit" slowly in the search bar. Check that the catalog updates in-place (debounced), but no record is written to the `SearchHistory` table (since `logHistory` parameter is false).
2. Press Enter or click the Search icon. Verify that a record is written to the `SearchHistory` table (since `logHistory` parameter is true).

**Acceptance Scenarios**:
1. **Given** I am a logged-in user typing a query in the search bar, **When** the search is debounced and executed automatically to fetch results, **Then** the request is sent with `logHistory: false` and no search history entry is logged.
2. **Given** I am a logged-in user, **When** I submit a search by pressing Enter, clicking the search icon, or changing filters, **Then** the request is sent with `logHistory: true` and the search details are persisted in the database.

---

### User Story 5 - Click-Through Tracking (Intent vs. Passive Clicks) (Priority: P2)

As a logged-in library member, when I click on a book from the hybrid search results list, I want the system to link this click with my active search history entry so that the system logs my high-intent interest in that specific book.

**Why this priority**: Essential data point for personalizing user recommendations. Clicks on search results show clear user intent.

**Independent Test**: Log in, search for "harry potter", click on one of the search results, and verify that the clicked book's ID is recorded in the `clickedBookIds` array of the corresponding search history record in the database.

**Acceptance Scenarios**:
1. **Given** I am logged in and have executed a search that generated a history record, **When** I click a book card from the results grid, **Then** the system sends a click tracking request that appends the book's ID to `clickedBookIds` of that specific search history entry.
2. **Given** I am browsing the general library page passively without an active search, **When** I click a book, **Then** no search history log is updated.

---

## Edge Cases

- **Empty / Whitespace-only Input**: If the user submits an empty query, the system should return the default catalog view (Popular Publishes) and not trigger the embedding service or pg_trgm similarity calculations.
- **Misspelled Connector Strings**: If a user inputs queries with typos in logical search connectors (e.g., "harry poter adn deathly hallows", where "adn" is a misspelled "and"), the regex filter must strip them out to avoid confusing the exact/trigram keyword matcher.
- **Service / Database Failures**: If the embedding transformer model fails (e.g., service offline or out of memory) or the pgvector extension errors, the search should degrade gracefully by falling back to the text/trigram keyword matching path and notifying the user of the reduced search fidelity.
- **Extreme Inputs**: If the user inputs a very long query (> 1000 characters), the search controller must truncate the string before embedding and keyword parsing to prevent buffer overflows or performance degradation.
- **Filters returning no books**: If filters applied on top of a hybrid search yield 0 books, the search history must still log the query and filters if `logHistory` was true, but the catalog UI must display the user-friendly "no results" state.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST execute a single hybrid search when a query is submitted, combining the (1) exact text keyword path, (2) typo-tolerant trigram path, and (3) semantic path into one process.
- **FR-002**: The backend MUST apply a regex filter to identify and strip out misspelled connector strings (e.g., "adn", "orr", "teh") from the search query, and split the remaining query text into standalone fragments for lexical/trigram matching.
- **FR-003**: The semantic path MUST convert the raw search query into an embedding vector using a local transformer model (`all-MiniLM-L6-v2`) before querying the database.
- **FR-004**: The database engine MUST run a pg_trgm trigram search (using a GIN index on text search fields) and a pgvector semantic search (using an HNSW index on the embedding field) simultaneously.
- **FR-005**: The system MUST combine the results from the lexical/trigram and semantic paths and rerank them using Reciprocal Rank Fusion (RRF) to generate a single sorted result set.
- **FR-006**: The catalog UI on the `/library` page MUST update in-place, replacing the default catalog list with hybrid search results, without using an overlay panel.
- **FR-007**: The system MUST support filtering search results in-place by Genre, Publication Year range, Page Count, and Language.
- **FR-008**: The search API MUST accept a boolean parameter `logHistory` to determine whether a search should be recorded in the database.
- **FR-009**: The system MUST only write a new `SearchHistory` record to the database for authenticated users when `logHistory: true` is passed (on Enter keypress, search button click, or filter change).
- **FR-010**: Debounced search requests triggered during typing MUST pass `logHistory: false` and must not write records to the `SearchHistory` table.
- **FR-011**: The system MUST support tracking result clicks by associating a clicked book ID with the active `SearchHistory` entry via an API endpoint (`POST /api/search/history/click`) for logged-in users.
- **FR-012**: If the local transformer embedding model is unavailable, the search MUST degrade gracefully to use the exact and trigram text matching paths, displaying a subtle warning to the user.

### Key Entities

- **Book**: Represents a book in the library database.
  - *Attributes*: `id`, `title` (GIN index: `books_title_trgm_idx` using `gin_trgm_ops`), `author` (GIN index: `books_author_immutable_trgm_idx` using custom function), `isbn`, `publisher`, `publicationDate`, `genres` (array), `pageCount`, `language`, `description`, `coverImage`, `embedding` (vector type with HNSW index for pgvector similarity matches), `pg_trgm` (trigram matching for typo tolerance).
  - * `immutable_array_to_string(arr text[], sep text)` -> Returns `text` [Volatility: IMMUTABLE] — **[NEWLY ENABLED]**. *Purpose*: Flattens array text vectors to support trigram indexes without crashing.

- **SearchHistory**: Represents a log of a search query executed by a logged-in user.
  - *Attributes*: `id`, `userId` (references User), `search_content` (raw search query input text only), `filters` (JSON object of applied filters), `clickedBookIds` (array of strings, referencing Book.id), `timestamp`.


---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The complete hybrid search (lexical, trigram, embedding generation, pgvector search, and RRF reranking) must execute and return results in under 900ms.
- **SC-002**: Client-side in-place catalog grid updates must complete rendering within 150ms of receiving the response from the backend.
- **SC-003**: 100% of searches with `logHistory: true` performed by authenticated users must successfully create a record in the `SearchHistory` table.
- **SC-004**: 100% of debounced searches with `logHistory: false` must NOT write to the database, ensuring zero log pollution from typing.
- **SC-005**: 100% of search result click-throughs by authenticated users must update the correct `clickedBookIds` array in the database.

---

## Assumptions

- **Local Transformer Model**: A local service or node-based model execution (e.g. via ONNX or Hugging Face Xenova/transformers) will run the `all-MiniLM-L6-v2` model to generate 384-dimensional embeddings.
- **Database Indexing**: The PostgreSQL database supports and has enabled both `pg_trgm` and `pgvector` extensions, with a GIN index on text search columns (title, author, publisher) and an HNSW index on the book embedding column.
- **User Authentication**: The server has access to the user's session context via auth middleware (`auth.middlewares.mjs`), which populates `req.user.id` when logged in.
