# Data Model: Librarian Book Management

**Feature Branch**: `028-librarian-book-management`  
**Date**: 2026-07-23  

---

## 1. Relational Entities (PostgreSQL Schema)

### Entity 1: `public.books`
Catalog representation of a unique book in the library system.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `book_id` | `varchar(20)` | PRIMARY KEY | Unique ID generated for the book (e.g. `BK1721829381`) |
| `title` | `text` | NOT NULL | Title of the book |
| `original_title` | `text` | NULLABLE | Original title if translated |
| `description` | `text` | NULLABLE | Book summary / description |
| `num_pages` | `int4` | NULLABLE, `CHECK (num_pages > 0)` | Page count |
| `publisher` | `text` | NULLABLE | Publisher name |
| `publication_date` | `date` | NULLABLE | Date of publication |
| `isbn` | `varchar(50)` | NULLABLE, UNIQUE | 10 or 13-digit ISBN |
| `rating` | `float4` | DEFAULT 0.0 | Average user rating |
| `series` | `text` | NULLABLE | Book series title |
| `author` | `_text` (text[]) | NULLABLE | Array of author names |
| `language_code` | `varchar(50)` | NULLABLE | Language code (e.g. `eng`, `vie`) |
| `book_format` | `varchar(50)` | NULLABLE | Format (e.g. `Paperback`, `Hardcover`) |
| `genres` | `_text` (text[]) | NULLABLE | Array of genre strings |
| `image_url` | `text` | NULLABLE | Image path / URL (updated via device file upload or web URL) |
| `price` | `float4` | NULLABLE, `CHECK (price >= 0)` | Book price |
| `embedding` | `public.vector` | NULLABLE (384-d vector) | Cosine vector embedding for semantic search |

---

### Entity 2: `public.library`
Inventory stock tracking per book at each physical library branch.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `book_id` | `varchar(20)` | FK -> `books.book_id` | Foreign key referencing catalog book |
| `branch_id` | `int4` | FK -> `branches.branch_id` | Foreign key referencing library branch |
| `quantity` | `int4` | NOT NULL, DEFAULT 0 | Total physical copies owned by the branch |
| `available_quantity` | `int4` | NOT NULL, DEFAULT 0, `CHECK (available_quantity <= quantity)` | Unborrowed and unreserved copies |
| `shelf` | `varchar(20)` | NULLABLE | Bookshelf location code (e.g., `F104`, `X12`) |

**Primary Key**: `(book_id, branch_id)`

---

### Entity 3: `public.branches`
Physical library branch locations.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `branch_id` | `serial4` | PRIMARY KEY | Branch ID sequence |
| `name` | `varchar(255)` | NOT NULL | Branch full name |
| `name_short` | `varchar(10)` | UNIQUE, NOT NULL | Short branch code (e.g., `CS1`, `CS2`) |
| `address` | `text` | NOT NULL | Branch address |
| `contact` | `varchar(50)` | NOT NULL | Branch phone/contact info |

---

### Entity 4: `public.borrow_book`
Active and historical borrowing/reservation records used for safeguard validations.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `borrow_id` | `uuid` | PRIMARY KEY | Borrow transaction ID |
| `user_id` | `uuid` | FK -> `users.user_id` | User ID |
| `book_id` | `varchar(20)` | FK -> `books.book_id` | Target book ID |
| `branch_id` | `int4` | FK -> `branches.branch_id` | Target branch ID |
| `status` | `varchar(20)` | NOT NULL | Status: `'reserved'`, `'pending'`, `'borrowed'` |

---

## 2. Graph Database Schema (Memgraph)

### Nodes
- `(:Book {id: STRING, title: STRING, isbn: STRING, embedding: LIST OF FLOAT})`
- `(:Branch {id: INTEGER, name: STRING})`
- `(:Author {name: STRING})`
- `(:Genre {name: STRING})`

### Relationships
- `(:Book)-[:AVAILABLE_AT {quantity: INTEGER, available_quantity: INTEGER, shelf: STRING}]->(:Branch)`
- `(:Book)-[:WRITTEN_BY]->(:Author)`
- `(:Book)-[:HAS_GENRE]->(:Genre)`

---

## 3. Validation Rules & State Transitions

### Bookshelf Location Rule
`shelf = computeShelfCode(title, userNumber)`
- Prefix: `A-Z` if `title[0]` is English ASCII letter (capitalized); `'X'` otherwise.
- Output string: `<Prefix><userNumber>` (e.g. `F104`, `X12`).

### Uniqueness Rule
- Before inserting new book into `books`: check `isbn` and `book_id` non-existence.
- Before updating existing book: check `isbn` non-existence for `book_id != target_book_id`.

### Stock Deletion & Reduction Safeguard
- Row deletion (`books` or `library`): Rejected if `COUNT(borrow_book WHERE status IN ('reserved', 'pending', 'borrowed')) > 0`.
- Stock reduction: `new_quantity >= (quantity - available_quantity)`.
