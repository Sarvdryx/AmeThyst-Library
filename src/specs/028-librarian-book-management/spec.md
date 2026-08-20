# Feature Specification: Librarian Book Management

**Feature Branch**: `028-librarian-book-management`  
**Created**: 2026-07-11  
**Updated**: 2026-07-23  
**Status**: Draft  
**Input**: User description: "modify spec of feature 028-Librarian-book-management. The workflow should synchronize the database correctly: allow remove/changing rows in database, allow checking uniqueness when insert new, allow config quantity for each branch. The location(bookshelf) field automatically take the first letter of the book title (or X if book is not english or start with special char) and let user input number. This feature is for librarian only. This should reuse the uploading image feature (upload from device and url) from feature uploading avatar of Profile management. (Data schema is saved in Data_schema.sql)"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a New Book to Catalog with Branch Inventory & Uniqueness Verification (Priority: P1)

As a logged-in librarian, I want to catalog a brand-new book with its cover image, metadata, and branch stock quantities so that it is properly indexed, unique in the database, and available for user discovery.

**Why this priority**: Core workflow for expanding the library catalog and managing physical stock across branches.  
**Independent Test**: A librarian submits a new book form with title, author, description, cover image (uploaded or via URL), unique ISBN, user-defined bookshelf number, and stock quantity for selected branches. The system checks ISBN uniqueness, generates the bookshelf location code (`<Prefix><Number>`), calculates the vector embedding, saves rows in `books` and `library` tables, and syncs nodes/relationships to Memgraph.

**Acceptance Scenarios**:

1. **Given** a logged-in librarian on the book creation form, **When** they enter valid book metadata, upload a cover image (from device or URL), specify a unique ISBN, input a bookshelf location number, and set stock quantities for library branches, **Then** the system validates ISBN uniqueness against the `books` table, auto-prefixes the bookshelf location with the uppercase English initial of the book title (or 'X' for non-English / special characters / numbers), inserts records into `books` and `library` tables, generates semantic vector embedding, and syncs to Memgraph.
2. **Given** a librarian inputs an ISBN that already exists in the catalog, **When** they attempt to submit the form, **Then** the system blocks insertion with a clear validation error indicating that a book with this ISBN already exists.

---

### User Story 2 - Update Book Metadata and Adjust Branch Inventories (Priority: P1)

As a logged-in librarian, I want to edit existing book records and modify branch quantities or shelf locations in the database so that book information and stock counts remain accurate.

**Why this priority**: Essential for maintaining data integrity, correcting typos, and adjusting physical stock allocations.  
**Independent Test**: A librarian modifies an existing book's title, description, cover image, or branch stock quantities. The system verifies updated ISBN uniqueness (if changed), updates `books` and `library` database rows, recalculates semantic embeddings if title/description changed, updates bookshelf prefixes if title initial changed, and syncs updates to Memgraph.

**Acceptance Scenarios**:

1. **Given** an existing book in the catalog, **When** a librarian updates metadata fields or branch stock quantities and submits, **Then** the updated attributes are persisted to the database (`books` and `library` tables) and synchronized to Memgraph.
2. **Given** a book stocked at a branch with active loans or reservations, **When** a librarian attempts to reduce the branch `quantity` below the count of active loans/reservations, **Then** the system blocks the update with a clear error message.

---

### User Story 3 - Remove / Delete Book Entry or Branch Stock Rows (Priority: P2)

As a logged-in librarian, I want to remove physical branch inventory rows or delete a book from the catalog entirely when copies are decommissioned or discarded.

**Why this priority**: Needed for inventory cleanup and decommissioning lost or damaged stock.  
**Independent Test**: A librarian selects to remove stock at a branch or delete a book entirely. The system checks for active borrow/reservation dependencies, deletes corresponding rows from `library` and `books` tables, and removes nodes/edges from Memgraph.

**Acceptance Scenarios**:

1. **Given** a book or branch stock row with zero active loans and no pending reservations, **When** a librarian chooses to delete the branch stock or the entire book, **Then** the system prompts for confirmation, deletes the corresponding `library` / `books` rows from Postgres, and detaches/deletes graph database nodes.
2. **Given** a book or branch stock row with active borrowed or reserved copies in `borrow_book`, **When** a librarian attempts to delete it, **Then** the system prevents deletion and displays an error message explaining that active borrowings exist.

---

### User Story 4 - Book Cover Image Upload (Device Upload & URL Reuse) (Priority: P2)

As a logged-in librarian, I want to upload a cover image from my local device or provide an external image URL using the existing image upload component (from Profile Management avatar feature) so that book listings have clear visual representations.

**Why this priority**: Ensures visual consistency and reuses verified profile avatar upload patterns (local file select/drag-and-drop & URL input).  
**Independent Test**: A librarian selects a image file from their device or pastes a web URL into the cover image component. The system previews the image, validates format/size, uploads or stores the URL, and assigns it to `books.image_url`.

**Acceptance Scenarios**:

1. **Given** a librarian on the book creation/edit form, **When** they select a local image file (JPG, PNG, WEBP) or paste an image URL, **Then** the system renders a live preview of the cover image and updates `image_url` upon saving.
2. **Given** a librarian selects an invalid file format or malformed URL, **When** the image component checks the input, **Then** an inline validation error is shown and form submission is disabled until resolved.

---

### User Story 5 - Transfer Inventory Between Branches (Priority: P2)

As a logged-in librarian, I want to transfer copies of a book between library branches so that physical stock can be rebalanced across physical locations.

**Why this priority**: Supports multi-branch inventory logistics.  
**Independent Test**: A librarian moves stock from Branch A to Branch B. The system verifies available quantity at Branch A, updates quantities at both branches in `library`, and syncs inventory nodes in Memgraph.

**Acceptance Scenarios**:

1. **Given** Branch A has available copies of a book, **When** a librarian transfers a valid count to Branch B, **Then** stock quantities are decremented at Branch A, incremented at Branch B, and synced to Memgraph.
2. **Given** a librarian tries to transfer more copies than are available (unborrowed/unreserved) at Branch A, **When** they attempt the transfer, **Then** the operation is blocked with a validation error.

---

### Edge Cases

- **Non-English / Special Character Titles**: If a book title begins with accented letters (e.g. "Áo Dài"), numbers (e.g. "1984"), or special symbols, the bookshelf location prefix defaults strictly to letter `'X'`.
- **Database / Graph Sync Failure**: If Memgraph sync fails during a book insertion/update/deletion, the Postgres transaction must commit cleanly while queuing the graph operation for asynchronous retry.
- **Active Loan Guard on Delete**: Attempts to delete a book or branch stock row that has active borrow records in `borrow_book` must fail gracefully without database constraint exceptions.
- **Embedding Compute Timeout**: If the 384-d embedding model is slow or unreachable, a zero-padded/fallback vector is assigned to `books.embedding` so book creation is never blocked.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Librarian Role Authorization)**: Access to book catalog creation, editing, deletion, branch inventory configuration, and inter-branch transfers MUST be restricted strictly to users with `librarian` or `admin` roles (`users.role`).
- **FR-002 (ISBN & Book ID Uniqueness Verification)**: Prior to inserting a new record into `public.books` or updating an existing book's ISBN, the system MUST execute a database uniqueness check. If `isbn` or `book_id` already exists for a different record, submission MUST be blocked with a duplicate validation error.
- **FR-003 (Bookshelf Location Code Logic)**: The location/bookshelf field (`library.shelf`) MUST automatically combine an initial prefix letter and a user-provided numeric input:
  - **Prefix Letter Rules**:
    - If `title` starts with an ASCII English letter (A-Z or a-z), the prefix MUST be the capitalized first letter (e.g., "Fahrenheit 451" -> `F`).
    - If `title` is empty, starts with a non-English character (e.g., Vietnamese accented characters like 'Đ', 'Á'), a digit (0-9), or a punctuation/special symbol, the prefix MUST be `'X'`.
  - **Numeric Input**: The user inputs a positive number (e.g., `101`), yielding a complete shelf code (e.g., `F101` or `X104`).
- **FR-004 (Branch Stock Configuration)**: For each branch in `public.branches`, the librarian MUST be able to configure total stock `quantity` in `public.library`. For new branch stock rows, `available_quantity` MUST initially equal `quantity`.
- **FR-005 (Database Row Mutation & Cleanup)**: The system MUST support row updates and removals:
  - **Update**: Modify attributes in `books` (`title`, `description`, `author`, `genres`, `isbn`, `price`, `image_url`, etc.) and `library` (`quantity`, `available_quantity`, `shelf`).
  - **Delete**: Delete specific `library` stock rows or entire `books` catalog records.
  - **Deletion Guard**: Deletion MUST be rejected if `borrow_book` contains active records (`reserved`, `pending`, `borrowed`) linked to the `book_id` or `(book_id, branch_id)`.
- **FR-006 (Reusable Image Upload Integration)**: Cover image input MUST reuse the avatar upload feature from Profile Management:
  - Support file upload directly from device (file picker / drop area with size & format validation).
  - Support image URL input (URL validation with image preview).
  - Save the resulting file path or URL string into `books.image_url`.
- **FR-007 (Automatic Vector Embedding Generation)**: Whenever a book is created or its `title`/`description` is modified, the system MUST generate a 384-dimensional vector embedding stored in `books.embedding` for semantic search index updating.
- **FR-008 (Graph Database Synchronization)**: All database mutations (`INSERT`, `UPDATE`, `DELETE`) on `books` and `library` MUST synchronize with Memgraph, updating `Book`, `Branch`, `Author`, and `Genre` nodes and `AVAILABLE_AT`, `WRITTEN_BY`, and `HAS_GENRE` relationships.
- **FR-009 (Stock Reduction Constraint)**: When editing branch stock, reducing `quantity` MUST NOT lower total stock below `(quantity - available_quantity)` (copies currently checked out or reserved).
- **FR-010 (Inter-Branch Inventory Transfer)**: The system MUST allow transferring copies between branches, decrementing `quantity` and `available_quantity` at the origin branch and incrementing them at the destination branch.

---

### Key Entities *(Data Schema Integration)*

Data structures align directly with `database/Data_schema.sql`:

- **Book Catalog Record (`public.books`)**:
  - `book_id` (varchar(20), Primary Key)
  - `title` (text), `original_title` (text)
  - `description` (text)
  - `num_pages` (int4), `publisher` (text), `publication_date` (date)
  - `isbn` (varchar(50), Unique per book)
  - `rating` (float4), `series` (text)
  - `author` (_text array), `genres` (_text array)
  - `language_code` (varchar(50)), `book_format` (varchar(50))
  - `image_url` (text, updated via reused device/URL upload component)
  - `price` (float4)
  - `embedding` (public.vector, 384-d semantic embedding)

- **Branch Stock Record (`public.library`)**:
  - `book_id` (varchar(20), Foreign Key -> `books.book_id`)
  - `branch_id` (int4, Foreign Key -> `branches.branch_id`)
  - `quantity` (int4, Total physical copies at branch)
  - `available_quantity` (int4, Available unborrowed/unreserved copies)
  - `shelf` (varchar(20), Bookshelf location code formed as `<Prefix><Number>`)
  - Primary Key: `(book_id, branch_id)`

- **Library Branch (`public.branches`)**:
  - `branch_id` (serial4, Primary Key)
  - `name` (varchar(255)), `name_short` (varchar(10), Unique)
  - `address` (text), `contact` (varchar(50))

- **User Role (`public.users`)**:
  - `user_id` (uuid, Primary Key)
  - `role` (varchar(20): must be `'librarian'` or `'admin'` for access)

- **Borrow Record (`public.borrow_book`)**:
  - `borrow_id` (uuid, Primary Key), `user_id`, `book_id`, `branch_id`
  - `status` (`'reserved'`, `'pending'`, `'borrowed'`) - guards stock reduction and record deletion.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly created books undergo ISBN uniqueness check and generate valid bookshelf codes (`<Prefix><Number>`) upon submission.
- **SC-002**: Reused image upload component handles device file uploads and URL inputs with image preview rendering in under 2 seconds.
- **SC-003**: 100% of book database mutations (`INSERT`, `UPDATE`, `DELETE`) successfully reflect in PostgreSQL and synchronize with Memgraph within 2 seconds.
- **SC-004**: 100% of deletion or stock reduction attempts on books with active loans/reservations are blocked without uncaught database errors.
- **SC-005**: 100% of non-librarian/non-admin users attempting to access book management routes or APIs are rejected with HTTP 403 Forbidden.

---

## Assumptions

- **Authentication System**: User role (`librarian`/`admin`) is available in session state from the existing authentication system.
- **Avatar Upload Component Reuse**: The existing device upload and URL image selection UI built for Profile Management avatar upload is exported as a reusable UI component.
- **Memgraph Availability**: Memgraph connection parameters are configured in the server environment variables.
