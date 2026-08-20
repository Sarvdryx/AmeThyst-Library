# Research: Reserve Book Feature

**Date**: 2026-06-25
**Feature**: 013-reserve-book

## Research Tasks & Findings

### 1. Concurrent Reservation Handling

**Task**: Research PostgreSQL row-level locking patterns to prevent race conditions

**Decision**: Use `SELECT ... FOR UPDATE` with transaction isolation

**Rationale**:
- Prevents race conditions where two users try to reserve the same last copy
- Ensures atomicity of check-and-decrement operation
- PostgreSQL's MVCC with row locking provides optimal concurrency

**Implementation Pattern**:
```sql
BEGIN;
SELECT available_quantity FROM library 
WHERE book_id = $1 AND branch_id = $2 
FOR UPDATE;
-- Check available_quantity > 0
UPDATE library SET available_quantity = available_quantity - 1 
WHERE book_id = $1 AND branch_id = $2;
INSERT INTO borrow_book (...) VALUES (...);
COMMIT;
```

**Alternatives Considered**:
- Application-level locking: Rejected due to complexity and scalability issues
- Optimistic locking with version column: Rejected as overkill for this use case
- Database triggers: Rejected due to maintenance complexity

---

### 2. JWT Authentication Integration

**Task**: Research how to extract user information from JWT tokens in Express middleware

**Decision**: Use existing `verifyToken` middleware from `auth.middleware.mjs`

**Rationale**:
- Middleware already extracts `{ userId, email, role }` from JWT payload
- Attaches to `req.user` for downstream controllers
- Consistent with other authenticated endpoints

**Implementation**:
```javascript
// routes/library.mjs
router.post('/reserve', verifyToken, reserveBook);

// controllers/library.controller.mjs
const userId = req.user.userId; // From JWT token
```

**Alternatives Considered**:
- Passing userId in request body: Rejected as insecure (user could impersonate others)
- Creating new auth middleware: Rejected as redundant

---

### 3. Branch Selection UX Patterns

**Task**: Research best practices for branch/location selection

**Decision**: Clickable cards in availability grid

**Rationale**:
- Visual and intuitive for users
- Shows branch-specific information (address, shelf, availability)
- Follows existing UI patterns in BookDetailTemplate
- Mobile-responsive with grid layout

**Implementation**:
- Each branch card becomes clickable when book is available
- Selected branch highlighted with border/color change
- Reserve button contextually linked to selected branch

**Alternatives Considered**:
- Dropdown selection: Rejected as less visual and harder to show branch details
- Map-based selection: Rejected as over-engineering for 2 branches
- Radio buttons: Rejected as less engaging UX

---

### 4. Reservation Expiration Logic

**Task**: Research typical reservation expiration periods

**Decision**: 48-hour expiration with automatic cleanup

**Rationale**:
- Industry standard for library reservations (24-72 hours)
- Balances user convenience with inventory turnover
- Prevents indefinite holds on popular books

**Implementation**:
- Set `expired_at` = current timestamp + 48 hours on reservation creation
- Database cron job or scheduled task to update status to 'expired'
- Frontend displays expiration time to users

**Alternatives Considered**:
- 24-hour expiration: Rejected as too short for user convenience
- 72-hour expiration: Rejected as too long for inventory management
- No expiration: Rejected as causes indefinite holds

---

### 5. Error Handling Patterns

**Task**: Research idiomatic error handling in Express.js

**Decision**: Centralized error handler with structured error responses

**Rationale**:
- Consistent error format across API
- Proper HTTP status codes for different error types
- User-friendly error messages

**Error Categories**:
- 400 Bad Request: Invalid input, book unavailable
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: Insufficient permissions
- 409 Conflict: Already reserved, concurrent conflict
- 500 Internal Server Error: Database errors, unexpected failures

**Implementation**:
```javascript
// Error response format
{
  "success": false,
  "error": {
    "code": "BOOK_UNAVAILABLE",
    "message": "No available copies at the selected branch"
  }
}
```

**Alternatives Considered**:
- Generic error messages: Rejected as poor UX
- Stack traces in production: Rejected as security risk
- Error logging only: Rejected as insufficient for client handling

---

### 6. Database Schema Decision

**Task**: Determine whether to use existing `borrow_book` table or create new `reservations` table

**Decision**: Use existing `borrow_book` table with `status='pending'`

**Rationale**:
- Table already exists with correct schema (user_id, book_id, branch_id, reserve_date, status)
- `status='pending'` semantically represents a reservation
- Avoids schema duplication and migration complexity
- `pin` field already exists for pickup verification

**Implementation**:
- Insert with `status='pending'`, `borrow_date=NULL`
- Set `expired_at` for reservation expiration
- Update `status` to 'borrowed' when user picks up book

**Alternatives Considered**:
- Creating `reservations` table: Rejected due to duplication of existing functionality
- Renaming `borrow_book` to `reservations`: Rejected as breaks existing borrow logic
- Using separate tables for reservations and borrows: Rejected as over-engineering

---

## Summary

All research tasks completed with clear decisions and rationales. The implementation will:

1. Use `SELECT ... FOR UPDATE` for concurrent reservation handling
2. Leverage existing JWT authentication middleware
3. Implement clickable branch selection cards
4. Set 48-hour reservation expiration
5. Use structured error responses with proper HTTP codes
6. Utilize existing `borrow_book` table for reservation tracking

No unresolved NEEDS CLARIFICATION items remain.