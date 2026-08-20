# Data Model: Book Return & Inspection System

## Entities

### Return Record (`return_book`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `return_id` | UUID | PK | Unique return identifier |
| `borrow_id` | UUID | FK → `borrow_book.borrow_id`, UNIQUE | One return per borrow |
| `branch_id` | UUID | FK → `branches.branch_id` | Receiving library branch |
| `return_date` | DATE | NOT NULL | Actual date of return |
| `is_overdue` | BOOLEAN | NOT NULL | Computed against `borrow_book.due_date` at return time |

### Book Penalty (`book_penalty`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `penalty_id` | UUID | PK | Unique penalty identifier |
| `borrow_id` | UUID | FK → `borrow_book.borrow_id`, UNIQUE | Links to borrow record |
| `return_id` | UUID | FK → `return_book.return_id`, NULLABLE | NULL if book is lost (no return) |
| `user_id` | UUID | FK → `users.user_id` | For quick user queries |
| `issue` | VARCHAR | CHECK(`OVERDUE`, `DAMAGED`, `LOST`, `COMBINED`) | Type of penalty |
| `description` | VARCHAR | NULLABLE | Damage details (librarian notes) |
| `record_date` | DATE | NOT NULL | In-person confirmation date |
| `penalty_amount` | NUMERIC | NOT NULL | Calculated penalty cost |
| `is_paid` | BOOLEAN | DEFAULT false | Payment status |
| `paid_at` | TIMESTAMP | NULLABLE | When payment was confirmed |

### Borrow Record (`borrow_book`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `borrow_id` | UUID | PK | Unique borrow identifier |
| `user_id` | UUID | FK → `users.user_id` | Borrower |
| `branch_id` | UUID | FK → `branches.branch_id` | Borrowing branch |
| `book_id` | UUID | FK → `books.book_id` | Book being borrowed |
| `status` | VARCHAR | | Values: `reserved`, `pending`, `borrowed`, `pending_return`, `returned`, `cancelled` |
| `pin` | VARCHAR(6) | NULLABLE | 6-digit return/PIN code |
| `expired_at` | TIMESTAMP | NULLABLE | PIN expiry timestamp |
| `reserve_date` | TIMESTAMP | | When the reservation was made |
| `borrow_date` | TIMESTAMP | NULLABLE | When the book was checked out |
| `due_date` | DATE | NULLABLE | Expected return date |

## Relationships

```
users (1) ────< borrow_book (N) ────> (1) books
borrow_book (1) ────< return_book (1)
borrow_book (1) ────< book_penalty (1)
return_book (1) ────< book_penalty (0..1)
branches (1) ────< return_book (N)
users (1) ────< book_penalty (N)
```

## State Transitions (borrow_book.status)

```
reserved → pending (PIN generated for pickup)
pending → borrowed (pickup confirmed; PIN consumed)
borrowed → pending_return (return PIN generated)
pending_return → returned (return confirmed; records created)
pending_return → borrowed (return PIN expired; stays borrowed)
borrowed → returned (direct return if no PIN flow used)
```

## Validation Rules

- One return per borrow (`borrow_id` UNIQUE in `return_book`)
- `penalty_amount` capped at book's lost penalty amount
- Perfect condition → cost = 0, no `book_penalty` record
- Lost → `return_id = NULL` in `book_penalty`, only penalty record created
- Both damage + overdue → `issue = 'COMBINED'`, penalty = damage_cost + overdue_cost

## Penalty Formulas

**Damage Cost**: `cost = (x * m_max) + Fee_admin + (N_errors - 1) * Fee_addon`
- `m_max`: coefficient of most severe damage
- `N_errors`: count of selected damage conditions
- `Fee_admin`: fixed processing fee (configurable)
- `Fee_addon`: per-extra-damage fee (configurable)
- Cap: `cost ≤ book_lost_penalty_amount`

**Overdue Cost**: `overdue_cost = 5% * price + (x - 3) * 2% * price`
- `x`: number of overdue days
- `price`: book price from `books` table

**Damage Coefficients**:

| Condition | Coefficient |
|-----------|------------|
| Perfect condition | 0.0 |
| Slight cover scratches | 0.05 |
| Folded pages | 0.10 |
| Pencil marks | 0.15 |
| Damaged binding | 0.30 |
| Missing mats | 0.30 |
| Ink marks | 0.40 |
| Torn pages | 0.50 |
| Water damage | 0.70 |
| Missing pages | 1.00 |
| Lost | 2.00 |

## Inventory Update Rule

For perfect condition returns: `UPDATE library SET available_quantity = available_quantity + 1 WHERE book_id = $1 AND branch_id = $2`
