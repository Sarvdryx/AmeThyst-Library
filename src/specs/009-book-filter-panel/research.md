# Research: Book Filter Panel

**Feature**: Book Filter Panel | **Date**: 2026-06-22

## Identified Unknowns & Technical Approaches

### 1. How to manage active filter state shareably in Next.js?
* **Research Question**: What is the best practice for synchronizing filter selection across components (e.g. `SearchBar`, `FilterPanel`, `PopularPublishes`) while enabling URL shareability?
* **Decision**: Serialize the filter state into URL query parameters (e.g., `?genres=physics,mathematics&branches=1&available=true&startYear=2020`). 
* **Rationale**: By using Next.js `useSearchParams`, `usePathname`, and `useRouter` hooks, the URL acts as the single source of truth. When a user clicks filter tags, the URL updates. When `PopularPublishes` detects URL changes (via standard React component re-rendering on query changes), it fetches the newly filtered book list from the API. This enables direct bookmarking and shareable catalog views.
* **Alternatives Considered**:
  - *React Context / Lifting State*: Simple to implement but does not support bookmarking or sharing. Refreshing resets filters.
  - *Browser Storage (sessionStorage)*: Preserves state across refreshes but doesn't allow copying and pasting a filtered URL to another user.

### 2. How to perform multi-genre intersection and fallback filtering in PostgreSQL?
* **Research Question**: How to match books that have one or more genres chosen, and how to classify the "Others" genre?
* **Decision**: 
  - Standard genres overlap: Use the PostgreSQL array overlap operator `&&`. For example, `b.genres && $1` where `$1` is a text array of selected genres (e.g., `ARRAY['Physics', 'Mathematics']`).
  - "Others" fallback: Match books where `b.genres` is `NULL` or empty, OR does not overlap with any of the predefined standard genres. The query will be: `(b.genres IS NULL OR NOT (b.genres && ARRAY['Mathematics', 'Physics', 'Biology', 'Computer Science', 'Fiction', 'Nonfiction', 'Philosophy', 'Psychology', 'Literature']))`.
* **Rationale**: Direct array overlap is highly performant in PostgreSQL compared to string matching.
* **Alternatives Considered**: 
  - *Full text search / LIKE matching*: Slow and complex for multiple items.
  - *Subqueries or separate tables*: Overkill given that `genres` is already modeled as a `text[]` array in the books table.

### 3. How to filter by library branch and availability status in the database?
* **Research Question**: How to structure the query when filtering by branch location and inventory count?
* **Decision**:
  - Perform a `LEFT JOIN public.library l ON b.book_id = l.book_id`.
  - Filter by branch: `l.branch_id = ANY($2)` where `$2` is an integer array of selected branch IDs (e.g. `ARRAY[1, 2]`).
  - Filter by availability: Add a conditional clause `AND l.available_quantity > 0` if the availability toggle is active.
* **Rationale**: The `public.library` table maps book quantities per branch location, making joins necessary for inventory-based filtering.
* **Alternatives Considered**: None, as the database normalization requires joining `library` to retrieve quantities and branch references.
