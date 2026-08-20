# Data Model: Reserve Book Feature

**Date**: 2026-06-25
**Feature**: 013-reserve-book

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │ borrow_book │       │    books    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ user_id (PK)│◄──────│ user_id (FK)│       │ book_id (PK)│◄──┐
│ email       │       │ book_id (FK)│──────►│ title       │   │
│ username    │       │ branch_id FK│──┐    │ author      │   │
│ role        │       │ reserve_date│  │    │ isbn        │   │
└─────────────┘       │ borrow_date │  │    │ image_url   │   │
                      │ due_date    │  │    └─────────────┘   │
                      │ pin         │  │                      │
                      │ expired_at  │  │    ┌─────────────┐   │
                      │ status      │  │    │  branches   │   │
                      └─────────────┘  │    ├─────────────┤   │
                                       │    │ branch_id   │   │
                                       │    │ name        │   │
                                       │    │ name_short  │   │
                                       │    │ address     │   │
                                       │    └─────────────┘   │
                                       │           ▲          │
                                       │           │          │
                                       │    ┌──────┴──────┐   │
                                       │    │   library   │   │
                                       │    ├─────────────┤   │
                                       └───►│ book_id     │───┘
                                            │ branch_id   │
                                            │ quantity    │
                                            │ available_qty│
                                            │ shelf       │
                                            └─────────────┘
```

## Entity Definitions

### 1. Users (Existing)

**Table**: `users`
**Purpose**: Store user accounts and authentication information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, DEFAULT gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| username | VARCHAR(100) | NOT NULL | Display name |
| phone_number | VARCHAR(20) | NULLABLE | Contact phone |
| avatar | VARCHAR(500) | NULLABLE | Profile image URL |
| role | VARCHAR(20) | DEFAULT 'user' | User role (admin/librarian/user) |
| borrow_num | INTEGER | DEFAULT 0 | Current borrow count |

### 2. Books (Existing)

**Table**: `books`
**Purpose**: Store book metadata and information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| book_id | VARCHAR(20) | PK | Open Library ID |
| title | TEXT | NOT NULL | Book title |
| original_title | TEXT | | Original language title |
| description | TEXT | | Book description |
| num_pages | INTEGER | | Page count |
| publisher | TEXT | | Publisher name |
| publication_date | DATE | | Publication date |
| isbn | VARCHAR(50) | | ISBN identifier |
| rating | REAL | | Average rating |
| series | TEXT | | Book series |
| author | TEXT[] | | Array of author names |
| language_code | VARCHAR(50) | | Language code |
| book_format | VARCHAR(50) | | Format (Hardcover, Paperback) |
| genres | TEXT[] | | Genre tags |
| filter_genres | TEXT[] | | Filter genres |
| image_url | TEXT | | Cover image URL |
| price | REAL | | Book price |
| embedding | VECTOR(384) | | pgvector for semantic search |

### 3. Branches (Existing)

**Table**: `branches`
**Purpose**: Store library branch locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| branch_id | INTEGER | PK, AUTO_INCREMENT | Branch identifier |
| name | VARCHAR(255) | NOT NULL | Full branch name |
| name_short | VARCHAR(10) | NOT NULL | Short code (e.g., "NVC") |
| address | TEXT | NOT NULL | Physical address |
| contact | VARCHAR(50) | | Contact phone |

**Seed Data**:
- Nguyen Van Cu Campus Library (NVC) - District 5, HCMC
- Linh Trung Campus Library (LT) - Thu Duc City, HCMC

### 4. Library/Inventory (Existing)

**Table**: `library`
**Purpose**: Junction table linking books to branches with inventory data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| book_id | VARCHAR(20) | FK → books, PK | Book identifier |
| branch_id | INTEGER | FK → branches, PK | Branch identifier |
| quantity | INTEGER | DEFAULT 0, CHECK (>= 0) | Total copies owned |
| available_quantity | INTEGER | DEFAULT 0, CHECK (>= 0) | Currently available copies |
| shelf | VARCHAR(20) | | Shelf location code |

**Constraints**:
- `chk_available_qty`: CHECK (available_quantity <= quantity)

### 5. Borrow Book (Modified - Used for Reservations)

**Table**: `borrow_book`
**Purpose**: Track book reservations and borrows

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| borrow_id | UUID | PK, DEFAULT gen_random_uuid() | Reservation/borrow identifier |
| user_id | UUID | FK → users, NOT NULL | User who reserved |
| book_id | VARCHAR(20) | FK → books, NOT NULL | Reserved book |
| branch_id | INTEGER | FK → branches, NOT NULL | Branch for pickup |
| reserve_date | DATE | DEFAULT CURRENT_DATE | When reservation was made |
| borrow_date | DATE | NULLABLE | When physically borrowed (NULL when reserved) |
| due_date | DATE | NULLABLE | When book is due (NULL when reserved) |
| pin | VARCHAR(10) | | Pickup verification code |
| expired_at | TIMESTAMP | | When reservation expires |
| status | VARCHAR(20) | DEFAULT 'pending' | Reservation status |

**Status Values**:
- `pending`: Reservation active, awaiting pickup
- `borrowed`: Book physically borrowed
- `returned`: Book returned to library
- `expired`: Reservation expired (automatic)
- `cancelled`: User cancelled reservation

**Constraints**:
- `chk_borrow_dates`: CHECK (due_date >= borrow_date)
- `chk_status`: CHECK (status IN ('expired', 'pending', 'borrowed', 'returned', 'cancelled'))

## Validation Rules

### Reservation Validation

1. **User Authentication**: Must be authenticated (valid JWT token)
2. **Book Availability**: `available_quantity > 0` at selected branch
3. **Duplicate Check**: User cannot have multiple active reservations for same book
4. **Branch Validity**: Branch must exist in `branches` table
5. **Book Validity**: Book must exist in `books` table

### Data Integrity Rules

1. **Atomic Operations**: Reservation must be atomic (check availability + decrement + insert)
2. **Row Locking**: Use `SELECT ... FOR UPDATE` to prevent race conditions
3. **Transaction Isolation**: Use database transactions for consistency
4. **Foreign Key Integrity**: All references must be valid

## State Transitions

### Reservation Lifecycle

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│  User   │     │ System   │     │ Library  │
│ Action  │     │ Action   │     │  Staff   │
└────┬────┘     └────┬─────┘     └────┬─────┘
     │               │                │
     │ Reserve       │                │
     │──────────────►│                │
     │               │ Create         │
     │               │ reservation    │
     │               │ (status=pending)│
     │               │                │
     │               │ Set            │
     │               │ expired_at     │
     │               │ (48 hours)     │
     │               │                │
     │ Pick up       │                │
     │──────────────►│                │
     │               │ Verify pin     │
     │               │───────────────►│
     │               │                │
     │               │ Update status  │
     │               │ to 'borrowed'  │
     │               │ Set due_date   │
     │               │                │
     │ Return        │                │
     │──────────────►│                │
     │               │ Update status  │
     │               │ to 'returned'  │
     │               │ Restore        │
     │               │ available_qty  │
```

### Automatic Transitions

1. **Expiration**: System checks `expired_at` and updates status to 'expired'
2. **Cleanup**: Expired reservations trigger `available_quantity` restoration

## Indexes

### Recommended Indexes

```sql
-- For reservation lookup by user
CREATE INDEX idx_borrow_book_user_status 
ON borrow_book(user_id, status);

-- For reservation lookup by book
CREATE INDEX idx_borrow_book_book_status 
ON borrow_book(book_id, status);

-- For expiration cleanup
CREATE INDEX idx_borrow_book_expired 
ON borrow_book(expired_at) 
WHERE status = 'pending';

-- For inventory queries
CREATE INDEX idx_library_book_branch 
ON library(book_id, branch_id);
```

## Migration Notes

### No Schema Changes Required

The existing `borrow_book` table already supports reservation functionality:
- `reserve_date` tracks when reservation was made
- `status='pending'` represents active reservations
- `branch_id` tracks pickup location
- `pin` provides pickup verification
- `expired_at` supports reservation expiration

### Application Changes Required

1. **Backend Service**: Rewrite `createReservation()` to insert into `borrow_book`
2. **Backend Controller**: Extract `userId` from JWT token
3. **Backend Route**: Add authentication middleware
4. **Frontend**: Add branch selection UI
5. **Frontend**: Integrate with authentication system