# Data Model: Book Wishlist and Dashboard Integration

## PostgreSQL Schema

### Table: `user_wishlist`
Holds the user's saved wishlist books.

```sql
CREATE TABLE public.user_wishlist (
    wish_id uuid DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    book_id varchar(255) NOT NULL,
    added_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT user_wishlist_pkey PRIMARY KEY (wish_id),
    CONSTRAINT fk_wishlist_book FOREIGN KEY (book_id) REFERENCES public.books(book_id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_user_book_wishlist UNIQUE (user_id, book_id)
);
```

#### Fields:
- `wish_id` (UUID): Unique identifier for the wishlist item. Auto-generated on insertion (`gen_random_uuid()`).
- `user_id` (UUID): Reference to the `public.users` table (`user_id`).
- `book_id` (varchar(255)): Reference to the `public.books` table (`book_id`).
- `added_at` (timestamp): The timestamp when the user saved the book.

---

## Memgraph Graph Schema

### Nodes
- **`User`**: Represents a library member.
  - Required properties for sync: `id` (matching Postgres `user_id`).
- **`Book`**: Represents a catalog book.
  - Required properties for sync: `id` (matching Postgres `book_id`).

### Relationships
- **`[:WISHLISTED]`**: Connects a `User` to a `Book`.
  - Direction: `(User)-[:WISHLISTED]->(Book)`
  - Properties: `added_at` (String, formatted ISO-8601 timestamp).

---

## Validation & Business Rules

1. **Unique Constraint**: A user cannot save the same book to their wishlist more than once. Enforced via:
   - Postgres: Unique composite key on `(user_id, book_id)`.
   - Backend service validation: Checking for existing records before executing the `INSERT` query.
   - Memgraph: `MERGE` query targeting the relationship.
2. **Access Restriction**: Wishlist operations are only permitted if the authenticated caller's JWT payload has `role: 'user'`.
3. **Data Cascades**: When a book or user is deleted, their corresponding wishlist records MUST be automatically cleaned up (`ON DELETE CASCADE` foreign keys).
