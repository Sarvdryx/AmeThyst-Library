# Data Model: Memgraph Recommendation DB Synchronization

This document defines the schema, properties, relationships, and validation rules for the entities synchronized from PostgreSQL to Memgraph.

---

## 1. Node Types (Entities)

### User
Represents a library patron who interacts with books, performs searches, and receives recommendations.
- **Label**: `User`
- **Properties**:
  - `id` (String, Unique Constraint): UUID matching PostgreSQL `user_id`.
  - `username` (String): Display name of the user.
  - `role` (String): Role of the user (e.g., `'user'`, `'admin'`).
  - `features` (List of Floats, Size: 384): Vector embedding representing user preferences. Defaults to 384-dimensional zero vector on creation.

### Book
Represents a library catalog item.
- **Label**: `Book`
- **Properties**:
  - `id` (String, Unique Constraint): String matching PostgreSQL `book_id`.
  - `title` (String): Title of the book.
  - `description` (String): Brief description. Defaults to `"No description available"`.
  - `publication` (String): Date of publication formatted as YYYY-MM-DD. Defaults to `"Unknown"`.
  - `num_pages` (Integer): Total pages. Defaults to `0`.
  - `rating` (Float): Average review rating. Defaults to `0.0`.
  - `language_code` (String): Language. Defaults to `"en"`.
  - `embedding` (List of Floats, Size: 384): Vector embedding of book details. Defaults to 384-dimensional zero vector.

### Genre
Represents book genres.
- **Label**: `Genre`
- **Properties**:
  - `name` (String, Unique Constraint): Name of the genre.

### Author
Represents book authors.
- **Label**: `Author`
- **Properties**:
  - `name` (String, Unique Constraint): Name of the author.

---

## 2. Relationship Types (Edges)

### WISHLISTED
Represents a user adding a book to their wishlist.
- **Source**: `User`
- **Target**: `Book`
- **Type**: `WISHLISTED`
- **Properties**:
  - `added_at` (String): ISO 8601 timestamp of when the book was wishlisted.

### RECOMMENDED
Represents a recommendation record generated for the user.
- **Source**: `User`
- **Target**: `Book`
- **Type**: `RECOMMENDED`
- **Properties**:
  - `showed_at` (String): ISO 8601 timestamp of when the recommendation was made.
  - `is_clicked` (Boolean): Flag indicating if the user clicked the recommended book.
  - `renewed_at` (String, Nullable): ISO 8601 timestamp of when the recommendation record was updated.

### SEARCHED
Represents a search action where the user clicked a specific book result.
- **Source**: `User`
- **Target**: `Book`
- **Type**: `SEARCHED`
- **Properties**:
  - `search_id` (String): UUID matching PostgreSQL `search_id`.
  - `created_at` (String): ISO 8601 timestamp of the search.
  - `query` (String): Search keyword string.

---

## 3. PostgreSQL to Memgraph Mapping

| PostgreSQL Table | Memgraph Element | Mapping Logic |
|---|---|---|
| `users` | Node: `(u:User)` | `user_id` -> `id` |
| `books` | Node: `(b:Book)` | `book_id` -> `id`, `embedding` -> `embedding` |
| `user_wishlist` | Edge: `[r:WISHLISTED]` | `user_id` -> source, `book_id` -> target, `added_at` -> `added_at` |
| `search_history` | Edge: `[r:SEARCHED]` | `user_id` -> source, `book_clicked` -> target, `search_content` -> `query` |
| `recommends` | Edge: `[r:RECOMMENDED]` | `user_id` -> source, `book_id` -> target, `showed_at`/`is_clicked`/`renewed_at` properties |

---

## 4. Constraint Definitions
To ensure data integrity, the following Cypher commands must be established on initialization:
```cypher
CREATE CONSTRAINT ON (b:Book) ASSERT b.id IS UNIQUE;
CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE;
CREATE CONSTRAINT ON (a:Author) ASSERT a.name IS UNIQUE;
CREATE CONSTRAINT ON (g:Genre) ASSERT g.name IS UNIQUE;
```
