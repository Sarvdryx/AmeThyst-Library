# Quickstart Validation Guide: Reserve Book Feature

**Date**: 2026-06-25
**Feature**: 013-reserve-book

## Prerequisites

1. **Database**: PostgreSQL running with seed data
   - Books table populated
   - Branches table with 2 branches (NVC, LT)
   - Library/inventory table with book availability
   - Users table with test user accounts

2. **Backend Server**: Running on `http://localhost:5000`
   - Environment variables configured (JWT_SECRET, PORT, DATABASE_URL)
   - Authentication system functional

3. **Frontend Server**: Running on `http://localhost:3000`
   - NEXT_PUBLIC_API_URL=http://localhost:5000 configured
   - Theme and i18n systems operational

4. **Test User**: Valid JWT token from authenticated user
   - Email: test@example.com
   - Password: testpassword123

## Validation Scenarios

### Scenario 1: Reserve Available Book (P1)

**Goal**: Verify user can reserve a book with available copies

**Steps**:
1. Open browser and navigate to `http://localhost:3000`
2. Login with test user credentials
3. Navigate to book catalog (`/library`)
4. Click on a book with available copies (e.g., "The Great Gatsby")
5. Verify book detail page loads with availability grid
6. Click on a branch card (e.g., "Nguyen Van Cu Campus Library")
7. Verify branch is selected (highlighted border)
8. Click "Reserve" button
9. Verify loading state appears
10. Verify success message with PIN code
11. Verify available copies decremented by 1
12. Verify button shows "Reserved" state

**Expected Outcome**:
- Reservation created in database with status='pending'
- `available_quantity` decremented at selected branch
- User receives pickup PIN
- Page shows updated availability

**Validation Query**:
```sql
SELECT * FROM borrow_book 
WHERE user_id = '<test_user_id>' 
AND status = 'pending'
ORDER BY reserve_date DESC 
LIMIT 1;
```

---

### Scenario 2: View Reservation Status (P2)

**Goal**: Verify user can see their active reservations

**Steps**:
1. Login as test user
2. Navigate to dashboard (`/dashboard`)
3. Locate "My Reservations" section
4. Verify reservation appears with:
   - Book title and cover
   - Branch name and address
   - Reservation date
   - Expiration date/time
   - Status (pending)
   - PIN code

**Expected Outcome**:
- Reservation listed with all details
- Status shows "pending"
- PIN code visible for pickup

---

### Scenario 3: Handle Unavailable Books (P3)

**Goal**: Verify graceful handling when book is unavailable

**Steps**:
1. Navigate to a book with 0 availability across all branches
2. Verify reserve button is disabled
3. Hover over disabled button
4. Verify tooltip explains unavailability

**Expected Outcome**:
- Reserve button visually disabled
- Tooltip provides clear explanation
- No reservation attempt possible

---

### Scenario 4: Concurrent Reservation Handling

**Goal**: Verify system prevents overbooking

**Steps**:
1. Open two browser tabs with same book (1 available copy)
2. Login as different users in each tab
3. Select same branch in both tabs
4. Reserve in first tab
5. Attempt to reserve in second tab
6. Verify second user sees "Book Unavailable" error
7. Verify only 1 reservation exists in database

**Expected Outcome**:
- First reservation succeeds
- Second reservation fails with appropriate error
- No overbooking occurs

**Validation Query**:
```sql
SELECT COUNT(*) FROM borrow_book 
WHERE book_id = '<book_id>' 
AND branch_id = <branch_id> 
AND status = 'pending';
```

---

### Scenario 5: Cancel Reservation

**Goal**: Verify user can cancel active reservation

**Steps**:
1. Login as user with active reservation
2. Navigate to dashboard
3. Find reservation in "My Reservations"
4. Click "Cancel" button
5. Confirm cancellation
6. Verify success message
7. Verify availability restored

**Expected Outcome**:
- Reservation status updated to 'cancelled'
- `available_quantity` incremented at branch
- Reservation removed from active list

**Validation Query**:
```sql
SELECT status FROM borrow_book 
WHERE borrow_id = '<reservation_id>';

SELECT available_quantity FROM library 
WHERE book_id = '<book_id>' 
AND branch_id = <branch_id>;
```

---

### Scenario 6: Reservation Expiration

**Goal**: Verify automatic expiration of old reservations

**Steps**:
1. Create reservation (or use test data with past expiration)
2. Wait for expiration period (or modify `expired_at` in database)
3. Run expiration cleanup script/cron job
4. Verify reservation status updated to 'expired'
5. Verify availability restored

**Expected Outcome**:
- Reservation status changed to 'expired'
- `available_quantity` incremented at branch
- Reservation no longer appears in active list

**Manual Test** (for development):
```sql
-- Update expiration to past time
UPDATE borrow_book 
SET expired_at = NOW() - INTERVAL '1 hour'
WHERE borrow_id = '<reservation_id>';

-- Run cleanup script
-- (implementation dependent)
```

---

### Scenario 7: Authentication Required

**Goal**: Verify unauthenticated users cannot reserve

**Steps**:
1. Open book detail page without logging in
2. Verify reserve button shows "Login to Reserve"
3. Click button
4. Verify redirect to login page
5. Login
6. Verify redirect back to book detail page

**Expected Outcome**:
- Unauthenticated users see login prompt
- After login, user can reserve
- No API calls made without valid token

---

### Scenario 8: Error Handling

**Goal**: Verify proper error messages

**Steps**:
1. Test network failure during reservation
2. Test invalid book ID
3. Test invalid branch ID
4. Test expired JWT token

**Expected Outcome**:
- Network error: "Connection error. Please try again."
- Invalid book: "Book not found"
- Invalid branch: "Branch not found"
- Expired token: "Session expired. Please login again."

---

## API Testing with cURL

### 1. Login and Get Token

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'
```

### 2. Reserve Book

```bash
curl -X POST http://localhost:5000/api/library/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"bookId": "27161156", "branchId": 1}'
```

### 3. Get Book Details

```bash
curl -X GET http://localhost:5000/api/library/books/27161156 \
  -H "Authorization: Bearer <jwt_token>"
```

### 4. Cancel Reservation

```bash
curl -X DELETE http://localhost:5000/api/library/reserve/<reservation_id> \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Database Validation Queries

### Check Reservation Created

```sql
SELECT 
  bb.borrow_id,
  bb.user_id,
  bb.book_id,
  bb.branch_id,
  bb.reserve_date,
  bb.expired_at,
  bb.status,
  bb.pin,
  b.title as book_title,
  br.name as branch_name
FROM borrow_book bb
JOIN books b ON bb.book_id = b.book_id
JOIN branches br ON bb.branch_id = br.branch_id
WHERE bb.user_id = '<user_id>'
AND bb.status = 'pending'
ORDER BY bb.reserve_date DESC;
```

### Check Availability Updated

```sql
SELECT 
  l.book_id,
  l.branch_id,
  l.quantity,
  l.available_quantity,
  l.shelf,
  b.title as book_title,
  br.name as branch_name
FROM library l
JOIN books b ON l.book_id = b.book_id
JOIN branches br ON l.branch_id = br.branch_id
WHERE l.book_id = '<book_id>';
```

### Check Concurrent Reservation Prevention

```sql
-- Should return only 1 reservation for last copy
SELECT COUNT(*) as reservation_count
FROM borrow_book
WHERE book_id = '<book_id>'
AND branch_id = <branch_id>
AND status = 'pending';
```

---

## Troubleshooting

### Common Issues

1. **Reservation fails with "Book Unavailable"**
   - Check `available_quantity` in `library` table
   - Verify branch ID is correct
   - Check for concurrent reservations

2. **Authentication errors**
   - Verify JWT token is valid and not expired
   - Check Authorization header format: `Bearer <token>`
   - Ensure user exists in database

3. **Availability not updating**
   - Check transaction committed successfully
   - Verify no database locks
   - Refresh page to get fresh data

4. **PIN not received**
   - Check `pin` column in `borrow_book` table
   - Verify PIN generation logic in service

### Debug Mode

Enable debug logging in backend:

```bash
DEBUG=library:* npm run dev
```

Check backend logs for:
- SQL queries executed
- Transaction commits/rollbacks
- Error stack traces