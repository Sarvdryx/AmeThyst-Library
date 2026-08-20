# Phase 0 Research: Librarian Book Management

**Feature Branch**: `028-librarian-book-management`  
**Date**: 2026-07-23  

---

## 1. Research Overview & Key Technical Decisions

### Decision 1: Role-Based Access Control (RBAC) & Middleware Guard
- **Question**: How to enforce librarian-only access to book management APIs and Next.js UI routes?
- **Decision**: 
  - **Backend**: Use `role.middlewares.mjs` to extract user role from session/JWT token and verify role is `'librarian'` or `'admin'`. Reject unauthorized requests with `403 Forbidden`.
  - **Frontend**: Protect Next.js App Router librarian pages (`/app/librarian/books` or similar) via route guards checking user role state in session Context.
- **Rationale**: Meets requirement `FR-001` and aligns with project constitution (`auth.middlewares.mjs` / `role.middlewares.mjs`).

---

### Decision 2: Bookshelf Location Code Generation Algorithm
- **Question**: How to automatically format `library.shelf` based on book title and user input?
- **Decision**: 
  - Implement a helper utility function `generateBookshelfCode(title, userNumber)` in `server/src/utils/book.utils.mjs` and matching client validator.
  - **Algorithm**:
    1. Trim `title`. If empty or null, prefix = `'X'`.
    2. Extract `firstChar = title.charAt(0)`.
    3. If `firstChar` matches `/^[a-zA-Z]$/`, prefix = `firstChar.toUpperCase()`.
    4. Otherwise (Vietnamese diacritics e.g. 'Á', non-Latin scripts, digits, symbols), prefix = `'X'`.
    5. Clean `userNumber` (digits only, e.g. `104`).
    6. Return `${prefix}${userNumber}` (e.g. `F104` or `X104`).
- **Rationale**: Satisfies requirement `FR-003` unambiguously and ensures deterministic, clean bookshelf codes across all languages.

---

### Decision 3: Image Cover Upload Component Reuse
- **Question**: How to reuse the image upload functionality (device file upload & URL input) from the Profile Management avatar feature?
- **Decision**:
  - Export the underlying image uploader from `client/app/components/` as a reusable component (e.g. `ImageUploader.jsx`).
  - Support two modes:
    1. **File Upload (Device)**: Send image via `multipart/form-data` to backend API endpoint (`POST /api/upload/cover` or `POST /api/books/upload-cover`), save file into server static upload directory/S3, return relative/absolute image path string.
    2. **URL Input**: Validate web image URL format, render live preview in the component, and store URL directly in `books.image_url`.
- **Rationale**: Directly satisfies requirement `FR-006` and adheres to Atomic Design and Reusability principles (Constitution Core Principle I).

---

### Decision 4: Database Row Mutation & Active Loan Deletion Safeguards
- **Question**: How to allow removing (`DELETE`) and modifying (`UPDATE`) rows in `books` and `library` tables without violating relational integrity or losing active loan history?
- **Decision**:
  - Before executing `DELETE FROM library WHERE book_id = $1 AND branch_id = $2` or `DELETE FROM books WHERE book_id = $1`:
    1. Query `borrow_book` table for records where `status IN ('reserved', 'pending', 'borrowed')`.
    2. If active records exist, abort operation and return `400 Bad Request` / `409 Conflict` with clear message: *"Cannot delete book/stock with active borrows or reservations."*
  - Before executing `UPDATE library SET quantity = $1`:
    1. Calculate `activeLoansCount = quantity - available_quantity`.
    2. Verify `newQuantity >= activeLoansCount`. If `newQuantity < activeLoansCount`, abort update with validation error.
- **Rationale**: Satisfies requirements `FR-005` and `FR-009` while ensuring transactional integrity in PostgreSQL.

---

### Decision 5: Uniqueness Checks for New and Updated Books
- **Question**: How to enforce ISBN and `book_id` uniqueness upon book insertion or update?
- **Decision**:
  - On `POST /api/books` (create new book):
    - Generate unique `book_id` (e.g., `BK` + random 10-digit number or UUID short string).
    - Query `SELECT 1 FROM books WHERE isbn = $1 OR book_id = $2`.
    - If match found, reject request with `409 Conflict` ("ISBN already exists in catalog").
  - On `PUT /api/books/:book_id` (update existing book):
    - If ISBN is updated, query `SELECT 1 FROM books WHERE isbn = $1 AND book_id != $2`.
    - Block update if ISBN matches a different existing book.
- **Rationale**: Satisfies requirement `FR-002` and guarantees data integrity.

---

### Decision 6: Dual Database Synchronization (PostgreSQL + Memgraph)
- **Question**: How to synchronize `INSERT`, `UPDATE`, and `DELETE` operations across PostgreSQL and Memgraph?
- **Decision**:
  - In `book.services.mjs`:
    - Perform PostgreSQL transactional database operations first (`books`, `library`).
    - Upon success, trigger graph service helper `syncBookToGraph(bookId, action)` to update Memgraph Cypher nodes/edges (`Book`, `Branch`, `Author`, `Genre`, `AVAILABLE_AT`, `WRITTEN_BY`, `HAS_GENRE`).
    - Wrap graph sync in try-catch to log graph errors asynchronously without failing the primary DB commit if graph engine is briefly unavailable (`Edge Case`).
- **Rationale**: Satisfies requirements `FR-007` and `FR-008`.
