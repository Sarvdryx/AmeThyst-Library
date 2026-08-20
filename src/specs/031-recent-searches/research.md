# Research & Design Decisions: Recent Search History for Logged-In Users

## 1. Storage & Persistence Architecture

### Decision
Persist search history records in PostgreSQL using the existing `public.search_history` table schema, exposed via Express API endpoints (`GET /api/search/history?limit=5` and `POST /api/search/history`).

### Rationale
- The database schema already defines `public.search_history(search_id, user_id, search_content, created_at, filters)`.
- Persisting in PostgreSQL guarantees that search history remains synced across browser sessions, devices, and tab reloads.
- Server-side deduplication ensures that re-searching an existing query updates its `created_at` timestamp rather than creating multiple duplicate rows for the same term.

### Alternatives Considered
- **Browser LocalStorage**: Simple to implement but fails to persist cross-device or cross-browser, and loses history when browser storage is cleared.
- **In-Memory Cache**: Fast, but state is lost upon server restart or load balancing.

---

## 2. API Contract & Data Transfer

### Decision
Create clean, dedicated REST endpoints under `/api/search/history`:
- `GET /api/search/history?limit=5` — Returns the authenticated user's top 5 most recent unique search terms (`search_content`, `created_at`).
- `POST /api/search/history` — Accepts `{ search_content: string }`, upserts/updates the recency timestamp in `public.search_history`, and enforces the per-user unique constraint.

### Rationale
- Follows the application's layered architecture (`routes` -> `middlewares` -> `controllers` -> `services`).
- Uses existing `verifyToken` middleware to secure endpoints and automatically extract `req.user.userId`.
- For guest/unauthenticated users (`req.user` is undefined or route not called), search execution proceeds normally without invoking history persistence.

---

## 3. Frontend SearchBar Interaction & Dropdown UX

### Decision
Integrate recent search history into the search input component (`SearchBar.tsx` / search inputs). Show a styled, accessible dropdown below the input field whenever an authenticated user focuses the input.

### Rationale
- Provides immediate visual feedback when the user clicks/taps into the search box.
- Clicking any item in the dropdown populates the search query, triggers search result fetching, closes the dropdown, and refreshes the query timestamp.
- Incorporates Light/Dark mode design tokens (`bg-white dark:bg-neutral-800 border-[#E8E2D5] dark:border-neutral-700`) and i18n keys (`t('search.recent_searches')`).

---

## 4. Query Normalization & Deduplication

### Decision
Normalize search query strings using `TRIM(search_content)` prior to saving or checking for existence. When a query already exists for a user, update `created_at = NOW()` instead of creating a duplicate row.

### Rationale
- Prevents redundant entries such as `"python "` vs `"python"`.
- Ensures the top 5 query results returned by `ORDER BY created_at DESC LIMIT 5` are strictly unique terms.
