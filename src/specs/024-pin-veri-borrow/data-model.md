# Data Model: Librarian PIN Verification & Book Borrowing Workflow

## Entity: BorrowRecord (`borrow_book`)

The central entity for the borrowing workflow. Already exists — this feature adds queries and mutations.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `borrow_id` | UUID / SERIAL | NO | Primary key |
| `user_id` | UUID / INTEGER FK | NO | References `users` table |
| `branch_id` | UUID / INTEGER FK | NO | References `branches` table — which branch holds the book |
| `book_id` | UUID / INTEGER FK | NO | References `books` table |
| `pin` | VARCHAR(6) | YES | 6-digit numeric PIN for counter pickup |
| `expired_at` | TIMESTAMP | YES | When the PIN expires |
| `status` | ENUM | NO | One of: `reserved`, `pending`, `borrowed`, `returned`, `cancelled` |
| `reserve_date` | TIMESTAMP | NO | When the reservation was created |
| `due_date` | TIMESTAMP | YES | When the book must be returned (set on confirmation) |
| `expired_reserve` | TIMESTAMP | YES | Derived: `reserve_date + INTERVAL '7 days'` |

### State Transitions

```
reserved ──(generate PIN)──> pending ──(librarian confirms)──> borrowed
                                  │
                                  └──(librarian cancels)──> (row deleted)
                                  │
                                  └──(PIN expires)──> reserved (auto cleanup)

borrowed ──(user returns)──> returned
borrowed ──(overdue)──> (fees accrue)
```

### Validation Rules

- `pin`: Must be exactly 6 numeric characters (0-9)
- `status`: Only transitions listed above are valid
- `due_date`: Must be exactly 14 days from confirmation date
- No duplicate active PIN for the same borrow record
- PIN expiry: checked via `expired_at > NOW()` in queries

---

## Entity: User (borrower)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | UUID / INTEGER | Primary key |
| `username` | VARCHAR | Display name |
| `gender` | VARCHAR | Gender |
| `phone_number` | VARCHAR | Contact phone |
| `email` | VARCHAR | Email address |
| `status` | ENUM | `active`, `suspended` — eligibility for borrowing |

### Eligibility Rule

A user is **eligible** to borrow if:
- `status` = `active`
- No books with `status` = `borrowed` where `due_date < NOW()` (no overdue books)

---

## Entity: Book

| Field | Type | Description |
|-------|------|-------------|
| `book_id` | UUID / INTEGER | Primary key |
| `title` | VARCHAR | Book title |
| `author` | VARCHAR | Author name |
| `publisher` | VARCHAR | Publisher |
| `genre` | VARCHAR | Genre/category |
| `price` | DECIMAL | Book price |

Inventory tracking is per-branch via a join table or branch-specific quantity field.

---

## Entity: Librarian (staff user)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | UUID / INTEGER | Primary key (same `users` table with `role` = `librarian`) |
| `branch_id` | UUID / INTEGER FK | The branch this librarian is assigned to |
| `username` | VARCHAR | Display name |

---

## Entity: CalendarEvent

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | UUID / SERIAL | Primary key |
| `user_id` | UUID / INTEGER FK | The user who owns this event |
| `title` | VARCHAR | Event title (e.g., "Book due: {title}") |
| `event_date` | DATE | The due date |
| `event_type` | VARCHAR | Type marker for color coding (e.g., `borrow_due`) |
| `borrow_id` | UUID / INTEGER FK | References the borrow record (optional) |
