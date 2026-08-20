# Quickstart: Hybrid Book Searching Validation

This guide provides scenarios to validate the implementation of the single-mode Hybrid Search (Lexical + Semantic + Reciprocal Rank Fusion) and intent logging.

---

## Prerequisites
- **Backend Server**: Running on `http://localhost:5000`
- **Frontend Client**: Running on `http://localhost:3000`
- **PostgreSQL Database**: Extensions `pg_trgm` and `pgvector` enabled. Books table seeded with vector embeddings and indexed.

---

## Validation Scenarios

### Scenario 1: Pre-processing & Typo-Tolerant Hybrid Search
1. **Action**: Open browser, go to `http://localhost:3000/library`.
2. **Action**: Type a query with typos and incorrect connectors: `"teh harry poter adn goblet"` and hit Enter.
3. **Expectation**:
   - The frontend updates the search results grid in-place.
   - The backend interceptor regex identifies and strips out `"teh"` and `"adn"`, leaving `"harry poter goblet"`.
   - The exact & trigram path matches `"harry"` and `"goblet"` and uses trigram similarity to match `"poter"` to `"Potter"`.
   - The semantic path converts `"harry poter goblet"` into a vector and performs a pgvector cosine similarity lookup.
   - RRF rank fusion merges the lists, and the books (like "Harry Potter and the Goblet of Fire") appear at the top.

### Scenario 2: Search Debounce vs. Enter Logging
1. **Action**: Type `"hobbi"` slowly character-by-character.
2. **Expectation**:
   - Results fetch automatically (debounced typing search) and update the grid in-place.
   - An API request `POST /api/search` is sent with `logHistory: false`.
   - Verify the database `search_history` table: **no new rows are created**.
3. **Action**: Press **Enter** once typing is finished.
4. **Expectation**:
   - The search executes. The API request is sent with `logHistory: true`.
   - A single new record is written to the `search_history` table containing the user search query.

### Scenario 3: Logging Filter Changes
1. **Action**: Click the Filter button to open the filter drawer. Leave the search query empty.
2. **Action**: Toggle the genre check for `"Fantasy"` and click Apply.
3. **Expectation**:
   - The catalog grid refreshes in-place with Fantasy books.
   - An API request `POST /api/search` with `logHistory: true` is sent.
   - A new search history log is written containing the search query (which is null/empty in this case) and the filter details in the `filters` column.

### Scenario 4: Click-Through Intent Tracking
1. **Action**: Execute a search for `"magic school"`, then click one of the returned book cards in the grid.
2. **Expectation**:
   - Redirects to the book details page.
   - A POST request is dispatched to `/api/search/history/click` to record this book ID under `clickedBookIds` for this search session ID.
3. **Action**: Go back to `/library`, clear searches, passively browse popular books, and click a card.
4. **Expectation**:
   - Redirects to book details; **no** click tracking request is sent.
