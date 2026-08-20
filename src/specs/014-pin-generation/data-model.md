# Data Model: PIN Generation for Book Pickup

**Date**: 2026-06-26
**Feature**: 014-pin-generation

## Entity: Reservation (borrow_book)

The `borrow_book` table is the primary entity. The PIN feature adds two field usages to existing columns — no schema migration required.

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `borrow_id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key — reservation identifier |
| `user_id` | UUID | NOT NULL | — | FK → `users.user_id` (CASCADE) |
| `book_id` | VARCHAR(20) | NOT NULL | — | FK → `books.book_id` (RESTRICT) |
| `branch_id` | INTEGER | NOT NULL | — | FK → `branches.branch_id` (CASCADE) |
| `reserve_date` | DATE | NOT NULL | `CURRENT_DATE` | When the reservation was made |
| `borrow_date` | DATE | NULLABLE | NULL | When the book was physically borrowed |
| `due_date` | DATE | NULLABLE | NULL | Return deadline (future feature) |
| `pin` | VARCHAR(10) | NULLABLE | NULL | **PIN feature**: 6-digit pickup verification code |
| `expired_at` | TIMESTAMP | NULLABLE | NULL | **PIN feature**: PIN expiration timestamp |
| `status` | VARCHAR(20) | NOT NULL | `'reserved'` | Current reservation status |

### Status Values

| Status | Description | PIN-Related? |
|--------|-------------|-------------|
| `reserved` | Active reservation, awaiting pickup | No PIN active |
| `pending` | PIN generated, awaiting counter verification | PIN is active |
| `borrowed` | Book physically checked out | No PIN |
| `expired` | 7-day pickup window elapsed | No PIN |

### PIN State Transitions

```
reserved ──[generate PIN]──→ pending
pending  ──[PIN expires]──→ reserved
pending  ──[server restart]──→ reserved
pending  ──[checkout]──→ borrowed
reserved ──[7 days pass]──→ expired
reserved ──[cancel]──→ (row deleted, inventory restored)
pending  ──[cancel]──→ (row deleted, inventory restored, PIN cleared)
```

**Note on Cancel**: The cancel action deletes the entire `borrow_book` row for both `reserved` and `pending` status. This is a change from the previous behavior which only allowed cancellation of `pending` reservations. The cleanup is identical for both statuses: restore available_quantity, delete the row (which inherently clears any PIN), and decrement borrow_num.

### Constraints

- **UNIQUE** on `pin` — ensures no two active reservations share the same PIN
- **CHECK** on `status` — only allows: `reserved`, `pending`, `borrowed`
- **CHECK** on `due_date >= borrow_date` — existing integrity rule

### Indexes

- `idx_borrowbook_user` on `(user_id)` — used for "my borrowed" queries
- `idx_borrowbook_book_branch` on `(book_id, branch_id)` — used for inventory checks
- Implicit index via UNIQUE constraint on `pin`

## Entity: PIN (logical — not a separate table)

The PIN is a logical entity stored within `borrow_book`. It is not a separate table.

### Attributes

| Attribute | Source Column | Type | Description |
|-----------|--------------|------|-------------|
| Value | `pin` | VARCHAR(10) | 6-digit numeric string (e.g., "847291") |
| Expiration | `expired_at` | TIMESTAMP | Exact moment the PIN becomes invalid |
| Reservation | `borrow_id` | UUID | The reservation this PIN belongs to |

### Lifecycle

1. **Generation**: `pin` = random 6-digit string, `expired_at` = NOW() + 5 minutes, `status` = 'pending'
2. **Active**: PIN can be viewed/reviewed by the user for up to 5 minutes
3. **Expiration**: Background job clears `pin` = NULL, `expired_at` = NULL, `status` = 'reserved'
4. **Startup Flush**: All `pending` statuses reverted to `reserved`, all PIN data cleared

## Entity: Branch (existing — read-only for PIN feature)

| Column | Type | Description |
|--------|------|-------------|
| `branch_id` | INTEGER | Primary key |
| `name` | VARCHAR | Full branch name |
| `name_short` | VARCHAR(10) | Short code (NVC, LT) |
| `address` | VARCHAR | Branch address |
| `contact` | VARCHAR | Contact number |

No changes to the Branch entity.

## Entity: User (existing — read-only for PIN feature)

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Primary key |
| `borrow_num` | INTEGER | Current active borrow/reservation count |

No changes to the User entity. The `borrow_num` is already incremented/decremented by existing reservation logic.

## Relationships

```
User (1) ──→ (N) Reservation
Book (1) ──→ (N) Reservation
Branch (1) ──→ (N) Reservation
Reservation (1) ──→ (1) PIN (logical, within same row)
```

## Data Volumes

- Active reservations per user: 0–5 (enforced by `MAX_BORROW_LIMIT`)
- Active PINs at any time: ~<50 (small library, in-person counter workflow)
- PIN collision probability: negligible (1M possible values, <50 active)
