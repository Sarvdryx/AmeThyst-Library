# Quickstart: PIN Generation for Book Pickup

**Date**: 2026-06-26
**Feature**: 014-pin-generation

## Prerequisites

- PostgreSQL database running with `borrow_book` table (schema already has `pin` and `expired_at` columns)
- Backend server running on `http://localhost:5000`
- Frontend client running on `http://localhost:3000`
- A test user account with at least one book reservation (status = `reserved`)

## Validation Scenarios

### Scenario 1: Generate and Display PIN

**Setup**: User has a reservation with `status = 'reserved'`

1. Log in as the test user
2. Navigate to `/dashboard/user/borrowed`
3. Locate a reserved book card in the "Currently Borrowing" tab
4. Click the "View PIN" button

**Expected**:
- A modal appears overlaying the page
- Modal displays a 6-digit numeric PIN (e.g., "847291")
- Modal shows a countdown timer starting at ~5:00
- Database: `borrow_book.status` = `'pending'`, `pin` = the displayed PIN, `expired_at` = NOW() + 5 min

**Verify in database**:
```sql
SELECT borrow_id, status, pin, expired_at
FROM borrow_book
WHERE user_id = '<test_user_id>' AND book_id = '<test_book_id>';
```

---

### Scenario 2: Reopen Modal Shows Same PIN

**Setup**: User has an active PIN (status = 'pending')

1. Close the PIN modal (click X or click outside)
2. Click "View PIN" again on the same book card

**Expected**:
- Same PIN is displayed (not a new one)
- Countdown shows updated remaining time (less than 5 minutes)
- No new row or update in the database

---

### Scenario 3: PIN Expiration

**Setup**: User has an active PIN

1. Generate a PIN
2. Wait 5 minutes (or manually set `expired_at` to a past time for testing)
3. Check the book card in the "Currently Borrowing" tab

**Expected**:
- Book card status reverts to showing "reserved" badge
- "View PIN" button is available again (not stuck in pending)
- Database: `pin` = NULL, `expired_at` = NULL, `status` = `'reserved'`

**Manual test shortcut**:
```sql
UPDATE borrow_book
SET expired_at = NOW() - INTERVAL '1 minute'
WHERE borrow_id = '<test_reservation_id>';
-- Wait up to 60 seconds for cleanup job to run
```

---

### Scenario 4: Server Startup Cleanup

**Setup**: At least one reservation has `status = 'pending'` with active PIN data

1. Stop the backend server
2. Manually set a reservation to pending with a PIN:
```sql
UPDATE borrow_book
SET status = 'pending', pin = '999999', expired_at = NOW() + INTERVAL '10 minutes'
WHERE borrow_id = '<test_reservation_id>';
```
3. Restart the backend server

**Expected**:
- After server starts, the reservation status reverts to `'reserved'`
- `pin` = NULL, `expired_at` = NULL

---

### Scenario 5: Cannot Generate PIN for Non-Reserved Status

**Setup**: User has a reservation with `status = 'borrowed'` or `status = 'expired'`

1. Attempt to call `POST /api/library/reserve/:reservationId/pin`

**Expected**:
- Response: `400 Bad Request` with `code: "NOT_PENDING"`
- No changes to the reservation in the database

---

### Scenario 6: Cannot Generate PIN for Another User's Reservation

**Setup**: User A has a reservation, User B tries to generate a PIN for it

1. Log in as User B
2. Attempt to call `POST /api/library/reserve/<User_A_reservation_id>/pin`

**Expected**:
- Response: `403 Forbidden` with `code: "FORBIDDEN"`
- No changes to the reservation

---

### Scenario 7: Concurrent PIN Generation (Uniqueness)

**Setup**: Two users simultaneously generate PINs for different reservations

1. User A clicks "View PIN" for reservation A
2. User B clicks "View PIN" for reservation B (within the same second)

**Expected**:
- Both receive different 6-digit PINs
- No uniqueness constraint violation
- Database shows two distinct `pin` values

---

### Scenario 8: Cancel Reservation with Status "reserved"

**Setup**: User has a reservation with `status = 'reserved'`

1. Log in as the test user
2. Navigate to `/dashboard/user/borrowed`
3. Locate a reserved book card in the "Currently Borrowing" tab
4. Click the "Cancel" button
5. Confirm the cancellation

**Expected**:
- The book card is removed from the "Currently Borrowing" tab
- A success toast is displayed
- Database: the `borrow_book` row is deleted
- Database: `library.available_quantity` is incremented by 1 for that book/branch
- Database: `users.borrow_num` is decremented by 1

**Verify in database**:
```sql
-- Should return 0 rows (row deleted)
SELECT * FROM borrow_book WHERE borrow_id = '<test_reservation_id>';

-- Should show incremented available_quantity
SELECT available_quantity FROM library
WHERE book_id = '<test_book_id>' AND branch_id = <test_branch_id>;
```

---

### Scenario 9: Cancel Reservation with Status "pending" (Active PIN)

**Setup**: User has a reservation with `status = 'pending'` and an active PIN

1. Generate a PIN for a reserved book
2. Navigate to `/dashboard/user/borrowed`
3. Click the "Cancel" button on the pending book card
4. Confirm the cancellation

**Expected**:
- The book card is removed from the "Currently Borrowing" tab
- A success toast is displayed
- Database: the `borrow_book` row is deleted (including the active PIN data)
- Database: `library.available_quantity` is incremented by 1
- Database: `users.borrow_num` is decremented by 1

**Verify in database**:
```sql
-- Should return 0 rows (row deleted, PIN cleared)
SELECT * FROM borrow_book WHERE borrow_id = '<test_reservation_id>';
```

---

### Scenario 10: Cannot Cancel Borrowed Reservation

**Setup**: User has a reservation with `status = 'borrowed'`

1. Attempt to call `DELETE /api/library/reserve/:reservationId`

**Expected**:
- Response: `400 Bad Request` with `code: "CANNOT_CANCEL"`
- No changes to the database

---

## API Testing (cURL)

### Generate PIN
```bash
curl -X POST http://localhost:5000/api/library/reserve/<reservationId>/pin \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

### Cancel reservation
```bash
curl -X DELETE http://localhost:5000/api/library/reserve/<reservationId> \
  -H "Authorization: Bearer <jwt_token>"
```

### Check reservation status
```bash
curl -X GET http://localhost:5000/api/library/my-borrowed \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Cleanup Verification

After all tests, verify no stale PIN data remains:
```sql
SELECT borrow_id, status, pin, expired_at
FROM borrow_book
WHERE pin IS NOT NULL OR status = 'pending';
-- Should return 0 rows after all PINs expire and cleanup runs
```
