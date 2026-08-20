# Quickstart: Book Return & Inspection System

## Prerequisites

- Server running: `cd server && npm run dev`
- Client running: `cd client && npm run dev`
- PostgreSQL database seeded with test data (books, users, branches, borrow records)

## Validation Scenarios

### Scenario 1: Generate Return PIN (User)

1. Login as a user who has borrowed books
2. Navigate to Dashboard → Borrowed Books
3. Click "Generate Return PIN" on a borrowed book card
4. **Expected**: 6-digit PIN displayed with 3-minute countdown; book status changes to `pending_return`

### Scenario 2: Verify Return PIN & Inspect (Librarian)

1. Login as a librarian
2. Navigate to Inspection tab
3. Enter the return PIN from Scenario 1 into `InlinePinVerification` modal
4. **Expected**: User details (username, gender, phone, email, birth date), book details (title, publisher, author, genres, image, price), and borrowing info (reserve date, borrow date, due date) displayed

### Scenario 3: Damage Assessment & Penalty

1. After PIN verification (Scenario 2), select "Slight cover scratches" and "Folded pages"
2. **Expected**: Description field enabled; "Perfect condition" and "Lost" buttons disabled; penalty cost displayed
3. Add description text and confirm return
4. **Expected**: Records created in `return_book` + `book_penalty`; `borrow_book.status = 'returned'`

### Scenario 4: Perfect Condition Return

1. Generate and verify return PIN for a different borrowed book
2. Select "Perfect condition"
3. **Expected**: All other condition buttons disabled; cost = 0; description field disabled
4. Confirm return
5. **Expected**: Only `return_book` record created; `library.available_quantity` incremented

### Scenario 5: Lost Book Return

1. Generate and verify return PIN
2. Select "Lost"
3. **Expected**: All other condition buttons disabled
4. Confirm return
5. **Expected**: Only `book_penalty` record created (no `return_book` record); `penalty_amount` = book price × 2 + fees

### Scenario 6: Overdue + Damaged Return

1. Use a borrow record past its `due_date`
2. Generate and verify return PIN
3. Select damage conditions
4. **Expected**: `penalty_amount` = damage cost + overdue cost; `issue = 'COMBINED'`
5. Both `return_book` + `book_penalty` records created

### Scenario 7: View Outstanding Debts (Librarian)

1. Login as librarian
2. Navigate to Books tab → "Loan & Fees" sub-tab
3. **Expected**: Users with `is_paid = false` penalties displayed
4. Search by username
5. **Expected**: Results filtered by username

### Scenario 8: Confirm Payment (Librarian)

1. From Scenario 7, click "Confirm Payment" on an outstanding debt
2. **Expected**: `book_penalty.is_paid = true`; `paid_at` timestamp set
3. User logs into their Fees tab
4. **Expected**: Payment appears in history, not in outstanding

### Scenario 9: View User Fees

1. Login as a user with both paid and unpaid penalties
2. Navigate to Dashboard → Fees tab
3. **Expected**: Outstanding debts listed separately from payment history

## API Endpoints Summary

| Method | Endpoint | Contract |
|--------|----------|----------|
| POST | `/api/user/borrowed/generate-return-pin` | [contracts/01-generate-return-pin.md](./contracts/01-generate-return-pin.md) |
| POST | `/api/librarian/verify-return-pin` | [contracts/02-verify-return-pin.md](./contracts/02-verify-return-pin.md) |
| POST | `/api/librarian/confirm-return` | [contracts/03-confirm-return.md](./contracts/03-confirm-return.md) |
| GET | `/api/librarian/loan-fees/outstanding` | [contracts/04-get-outstanding-debts.md](./contracts/04-get-outstanding-debts.md) |
| POST | `/api/librarian/loan-fees/confirm-payment` | [contracts/05-confirm-payment.md](./contracts/05-confirm-payment.md) |
| GET | `/api/user/fees` | [contracts/06-get-user-fees.md](./contracts/06-get-user-fees.md) |

## Data Model Reference

See [data-model.md](./data-model.md) for entity definitions, field types, and relationships.

## Test Commands

```bash
# Backend tests
cd server && npx vitest run

# Specific test for return flow (when implemented)
cd server && npx vitest run -- tests/return-book.test.mjs
```
