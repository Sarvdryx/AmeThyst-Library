# Tasks: Librarian Book Management

**Input**: Design documents from `specs/028-librarian-book-management/`  
**Prerequisites**: [plan.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/028-librarian-book-management/plan.md), [spec.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/028-librarian-book-management/spec.md), [data-model.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/028-librarian-book-management/data-model.md), [contracts/book-management-api.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/028-librarian-book-management/contracts/book-management-api.md), [quickstart.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/028-librarian-book-management/quickstart.md)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5)
- All descriptions include explicit file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project verification and configuration for book management feature

- [x] T001 Verify project structure in server/src/ and client/app/ per implementation plan
- [x] T002 [P] Verify database connection settings in server/src/config/postgres.config.mjs and server/src/config/memgraph.config.mjs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core helpers, role authorization, and base model/service structures required by all user stories

- [x] T003 [P] Implement role authorization middleware in server/src/middlewares/role.middlewares.mjs to restrict endpoints to librarian and admin roles
- [x] T004 [P] Implement bookshelf code generator helper generateBookshelfCode in server/src/utils/book.utils.mjs (English ASCII initial A-Z or X for non-English/special/numeric + user number)
- [x] T005 [P] Create base PostgreSQL query models in server/src/models/book.models.mjs for books, library, and branches tables
- [x] T006 [P] Create base graph sync methods in server/src/services/graph.services.mjs for Memgraph nodes and edges
- [x] T007 Setup Express routes registration in server/src/routes/book.routes.mjs applying auth and role middlewares

---

## Phase 3: User Story 1 - Add New Book Catalog & Branch Stock (Priority: P1) 🎯 MVP

**Goal**: Allow librarians to catalog a new book with metadata, image cover, ISBN uniqueness check, bookshelf code generation, vector embedding calculation, branch stock configuration, and Memgraph sync.

**Independent Test**: Submit a new book form from the UI. The backend validates ISBN uniqueness, formats shelf location code (e.g., F104 or X12), generates vector embedding, creates rows in books and library tables, and syncs to Memgraph.

- [x] T008 [P] [US1] Implement ISBN and Book ID uniqueness verification query in server/src/models/book.models.mjs
- [x] T009 [P] [US1] Implement 384-d vector embedding calculation utility in server/src/utils/book.utils.mjs
- [x] T010 [US1] Implement createBook service in server/src/services/book.services.mjs (handles DB transaction, embedding generation, uniqueness checks, and Memgraph sync)
- [x] T011 [US1] Implement createBookController in server/src/controllers/book.controllers.mjs for POST /api/books
- [x] T012 [P] [US1] Create Book Catalog Creation Modal UI in client/app/(dashboard)/librarian/books/components/BookFormModal.jsx with metadata inputs, live shelf prefix preview, and branch stock inputs
- [x] T013 [US1] Connect Book Form UI in client/app/(dashboard)/librarian/books/components/BookFormModal.jsx to POST /api/books endpoint with loading, error, and success state handling

---

## Phase 4: User Story 2 - Modify Metadata & Branch Inventory (Priority: P1)

**Goal**: Allow librarians to update existing catalog entries and branch stock quantities with ISBN uniqueness enforcement on update and stock reduction safeguards against active borrowings.

**Independent Test**: Edit a book's description or branch quantity. Changing title/description updates embeddings, changing title initial updates bookshelf prefix, and attempts to reduce quantity below active borrows are blocked.

- [x] T014 [P] [US2] Implement active loan calculation and stock reduction guard query in server/src/models/book.models.mjs
- [x] T015 [US2] Implement updateBook service in server/src/services/book.services.mjs handling updated ISBN uniqueness, title prefix updates, embedding re-generation, and stock reduction validation
- [x] T016 [US2] Implement updateBookController in server/src/controllers/book.controllers.mjs for PUT /api/books/:book_id
- [x] T017 [P] [US2] Build Book Edit & Stock Adjustment Modal UI in client/app/(dashboard)/librarian/books/components/BookEditModal.jsx
- [x] T018 [US2] Connect Book Edit UI in client/app/(dashboard)/librarian/books/components/BookEditModal.jsx to PUT /api/books/:book_id endpoint

---

## Phase 5: User Story 3 - Remove / Delete Book Entry or Branch Stock Rows (Priority: P2)

**Goal**: Allow librarians to remove physical branch inventory rows or delete catalog entries with safeguard validation against active borrowings in borrow_book.

**Independent Test**: Delete a stock row or book without active borrowings (succeeds). Attempt to delete a book with active borrowings in borrow_book (blocked with user-friendly error).

- [x] T019 [P] [US3] Implement active borrow record check query in server/src/models/book.models.mjs for borrow_book status (reserved, pending, borrowed)
- [x] T020 [US3] Implement deleteBookOrStock service in server/src/services/book.services.mjs to delete PostgreSQL library/books rows and detach Memgraph nodes
- [x] T021 [US3] Implement deleteBookController in server/src/controllers/book.controllers.mjs for DELETE /api/books/:book_id
- [x] T022 [P] [US3] Build Delete Confirmation Modal UI in client/app/(dashboard)/librarian/books/components/BookDeleteModal.jsx with error toast handling for active loan blocks

---

## Phase 6: User Story 4 - Cover Image Upload Reuse (Priority: P2)

**Goal**: Provide reusable cover image upload component supporting local device file uploads and web URL input with live preview, storing image string in books.image_url.

**Independent Test**: Select a local image file or paste an image URL in the cover image component. Verify live preview renders and image_url is populated upon saving.

- [x] T023 [P] [US4] Implement cover image file upload controller and multer route handler in server/src/controllers/book.controllers.mjs for POST /api/books/upload-cover
- [x] T024 [P] [US4] Create reusable ImageUploader component in client/app/components/ui/ImageUploader.jsx supporting device file upload and web URL input with live image preview
- [x] T025 [US4] Integrate ImageUploader into BookFormModal.jsx and BookEditModal.jsx to set books.image_url

---

## Phase 7: User Story 5 - Inter-Branch Inventory Transfer (Priority: P2)

**Goal**: Allow librarians to transfer physical copies between branches, adjusting quantity and available_quantity at origin and destination branches.

**Independent Test**: Transfer 3 copies from Branch 1 to Branch 2. System validates available quantity at Branch 1, decrements Branch 1 stock, increments Branch 2 stock, and syncs Memgraph.

- [x] T026 [P] [US5] Implement inter-branch stock transfer query in server/src/models/book.models.mjs
- [x] T027 [US5] Implement transferStock service in server/src/services/book.services.mjs validating source available quantity and updating PostgreSQL and Memgraph
- [x] T028 [US5] Implement transferStockController in server/src/controllers/book.controllers.mjs for POST /api/books/transfer
- [x] T029 [P] [US5] Build Stock Transfer Modal UI in client/app/(dashboard)/librarian/books/components/StockTransferModal.jsx and connect to transfer API endpoint

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Localization, theme system compliance, and end-to-end verification

- [x] T030 [P] Extract all user-facing text, button labels, and validation error messages into client/app/locales/en.json and client/app/locales/vi.json
- [x] T031 [P] Verify Tailwind Light/Dark mode classes across librarian book management page and modals in client/app/(dashboard)/librarian/books/
- [x] T032 Execute quickstart validation steps from specs/028-librarian-book-management/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion
- **User Story 4 (Phase 6)**: Depends on Foundational phase completion
- **User Story 5 (Phase 7)**: Depends on Foundational phase completion
- **Polish (Phase 8)**: Depends on User Stories completion

---

## Summary Statistics

- **Total Tasks**: 32
- **Completed Tasks**: 32 (100%)
- **Parallel Tasks**: 18 tasks marked `[P]`
