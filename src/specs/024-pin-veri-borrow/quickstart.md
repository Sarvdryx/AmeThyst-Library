# Quickstart: Librarian PIN Verification & Book Borrowing Workflow

## Prerequisites

- Backend server running on `http://localhost:5000`
- PostgreSQL database with `borrow_book`, `users`, `books`, `calendar_events` tables
- A librarian user account with JWT token
- A borrow record in `pending` status with a valid PIN (generated via the existing `/api/library/reserve/:id/pin` endpoint)
- Alternatively, seed the database with test data

## Setup

```bash
# From server/ directory
cd server
npm install

# Ensure .env has DATABASE_URL
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/library" >> .env

# Start server
npm start
```

## Validation Scenarios

### Scenario 1: Happy Path — Verify PIN, Confirm Loan

```bash
# 1. Librarian logs in and gets JWT
LOGIN_RESP=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"librarian1","password":"..."}')

TOKEN=$(echo $LOGIN_RESP | jq -r '.data.token')

# 2. Verify a valid PIN (use a PIN from a pending borrow record)
curl -s -X POST http://localhost:5000/api/library/verify-pin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"pin":"123456"}'

# Expected: 200 with borrower details and book details

# 3. Confirm the loan
curl -s -X POST http://localhost:5000/api/library/confirm-loan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"borrow_id":"<borrow_id_from_verify>"}'

# Expected: 200 with status "borrowed" and due_date = today + 14 days

# 4. Verify database state
# SELECT status, due_date FROM borrow_book WHERE borrow_id = '<id>';
# Expected: status='borrowed', due_date = today + 14 days
```

### Scenario 2: Error — Invalid PIN

```bash
curl -s -X POST http://localhost:5000/api/library/verify-pin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"pin":"999999"}'

# Expected: 404 with message "The PIN has expired or does not exist."
```

### Scenario 3: Error — Wrong Branch

```bash
# Use a token for a librarian assigned to a different branch
# Then try to verify a PIN that belongs to another branch's borrow record
curl -s -X POST http://localhost:5000/api/library/verify-pin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OTHER_BRANCH_TOKEN" \
  -d '{"pin":"123456"}'

# Expected: 403 with message "You have arrived at the wrong book borrowing branch."
```

### Scenario 4: Cancel Loan

```bash
# 1. Verify PIN first (same as Scenario 1 step 2)
# 2. Cancel instead of confirm
curl -s -X POST http://localhost:5000/api/library/cancel-loan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"borrow_id":"<borrow_id>"}'

# Expected: 200 with success message

# 3. Verify database state
# SELECT * FROM borrow_book WHERE borrow_id = '<id>';
# Expected: row deleted
# SELECT quantity FROM books WHERE book_id = '<book_id>';
# Expected: quantity incremented by 1
```

### Scenario 5: Borrower Ineligible

```bash
# Create or use a borrow record for a user with overdue books or suspended status
curl -s -X POST http://localhost:5000/api/library/confirm-loan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"borrow_id":"<overdue_user_borrow_id>"}'

# Expected: 409 with message "Borrower has overdue books or is suspended. Cannot confirm loan."
```

## Running Tests

```bash
# Run the existing test suite
npm test

# Run specific test file if created
npx jest tests/library/loan-verification.test.mjs
```

## Expected Outcomes

- All endpoints return consistent JSON with `success`, `data`, `message` fields
- PIN verification checks both existence, expiry, and branch match
- Loan confirmation atomically updates status, sets due_date, creates event, cleans up expired_reserve
- Loan cancellation atomically deletes record and increments book quantity
- Borrower eligibility prevents loans for suspended/overdue users
- All error cases return appropriate HTTP status codes (401, 403, 404, 409) with clear messages

## References

- [Data Model](./data-model.md) — entity definitions and state transitions
- [Contracts](./contracts/) — full request/response schemas for each endpoint
- [Spec](./spec.md) — feature specification with acceptance criteria
