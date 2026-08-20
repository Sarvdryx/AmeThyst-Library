# Feature Specification: Librarian PIN Verification & Book Borrowing Workflow

**Feature Branch**: `024-pin-veri-borrow`

**Created**: 2026-07-01

**Status**: Draft

**Input**: System Specification for Librarian PIN Verification and Book Borrowing Workflow backend — a complete server-side workflow for verifying librarian PIN, validating branch association, displaying user and book details, confirming/cancelling the loan, and updating the database.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify PIN and Branch (Priority: P1)

As a librarian, I want to enter a borrower's PIN and have the system validate it against the database and verify that the book belongs to my branch so that I can ensure the borrower is picking up from the correct location.

**Why this priority**: PIN and branch validation are the gating checks that must pass before any loan can proceed. Without them, the workflow cannot continue.

**Independent Test**: Can be fully tested by calling the verify endpoint with a valid PIN belonging to the librarian's branch, an expired/non-existent PIN, and a valid PIN from a different branch.

**Acceptance Scenarios**:

1. **Given** a librarian enters a 6-digit PIN, **When** the system looks up the PIN in the `borrow_book` table, **Then** if the PIN is not found, an error message "The PIN has expired or does not exist." is returned.
2. **Given** a valid PIN is found, **When** the system compares the librarian's `branch_id` with the `branch_id` on the `borrow_book` record, **Then** if they do not match, an error message "You have arrived at the wrong book borrowing branch." is returned.
3. **Given** both the PIN and branch match, **When** validation completes, **Then** the system returns the borrower's user details (username, gender, phone number, email) and book details (title, author, publisher, genre, price).

---

### User Story 2 - Confirm Book Loan (Priority: P1)

As a librarian, after verifying the borrower's identity and book details, I want to confirm the loan so that the book is checked out to the borrower with a proper due date.

**Why this priority**: Confirming the loan is the terminal success action of the workflow. Without it, the borrower cannot physically take the book.

**Independent Test**: Can be fully tested by calling the confirm endpoint after successful PIN verification and verifying the database is updated correctly.

**Acceptance Scenarios**:

1. **Given** the librarian has verified the PIN and reviewed the user/book details, **When** they click Confirm, **Then** the `status` in the `borrow_book` table is updated to `borrowed`.
2. **Given** the loan is confirmed, **When** the status updates, **Then** the `due_date` is set to exactly 14 days from the confirmation date.
3. **Given** the loan is confirmed, **When** the transaction completes, **Then** the user's calendar receives an event for the new due date.
4. **Given** the loan is confirmed, **When** the transaction completes, **Then** the `expired_reserve` date (derived from `reserve_date + 7 days`) is removed or nullified.

---

### User Story 3 - Cancel Book Loan (Priority: P1)

As a librarian, after verifying the borrower's details, I want to cancel the loan if there is an issue so that the reservation is freed and the book becomes available again.

**Why this priority**: Cancellation is a critical compensating transaction that must correctly reverse the reservation state.

**Independent Test**: Can be fully tested by calling the cancel endpoint and verifying the database is rolled back correctly.

**Acceptance Scenarios**:

1. **Given** the librarian has verified the PIN and is viewing the details, **When** they click Cancel, **Then** a confirmation dialog is displayed before proceeding.
2. **Given** the librarian confirms the cancellation, **When** the system processes it, **Then** the corresponding row is deleted from the `borrow_book` table.
3. **Given** the cancellation is processed, **When** the transaction completes, **Then** the book's `quantity` is incremented by 1 for that specific branch.
4. **Given** the cancellation confirmation dialog is displayed, **When** the librarian clicks "No" or dismisses it, **Then** no changes are made and the details view remains open.

---

### Edge Cases

- What happens if the librarian enters a PIN that was valid but expires during the verification process? The system should treat it as expired on the next check.
- What happens if the library has multiple branches and the same PIN exists in two different branches? The branch_id check ensures only the correct branch's record matches.
- What happens if the book quantity update fails during cancellation? The entire cancellation transaction should roll back to maintain data integrity.
- What happens if the `expired_reserve` date has already passed at the time of confirmation? The system should still proceed with the loan and simply clean up the expired date.
- What happens if the borrower has overdue books or suspensions? The system should check borrower eligibility before confirming the loan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an API endpoint to look up a PIN in the `pin` column of the `borrow_book` table.
- **FR-002**: If the PIN is not found or is expired, the system MUST return the error message: "The PIN has expired or does not exist."
- **FR-003**: After successful PIN lookup, the system MUST retrieve the librarian's `branch_id` and compare it with the `branch_id` in the `borrow_book` record.
- **FR-004**: If the branch IDs do not match, the system MUST return the error message: "You have arrived at the wrong book borrowing branch."
- **FR-005**: After successful PIN and branch validation, the system MUST return borrower details (username, gender, phone number, email) and book details (title, author, publisher, genre, price) for display.
- **FR-006**: The system MUST provide a loan confirmation endpoint that updates the `borrow_book` row status to `borrowed`.
- **FR-007**: Upon confirmation, the system MUST set the `due_date` to exactly 14 calendar days from the confirmation date.
- **FR-008**: Upon confirmation, the system MUST create a calendar event for the user for the new due date.
- **FR-009**: Upon confirmation, the system MUST remove or nullify the `expired_reserve` date (where `expired_reserve` = `reserve_date + 7 days`).
- **FR-010**: The system MUST provide a loan cancellation endpoint that, upon confirmation:
  - Deletes the corresponding row from the `borrow_book` table.
  - Increments the book's `quantity` by 1 for that specific branch.
- **FR-011**: The cancellation action MUST require a secondary confirmation before execution.
- **FR-012**: The cancellation denial (user declines confirmation) MUST leave the borrow_book record and book quantity unchanged.
- **FR-013**: All booking state mutations (confirm/cancel) MUST be wrapped in database transactions to ensure atomicity.
- **FR-014**: The system MUST check the borrower's eligibility (no overdue violations, no suspensions) before allowing the loan to be confirmed.

### Key Entities *(include if feature involves data)*

- **Borrow Record (`borrow_book`)**:
  - `borrow_id`: Unique identifier for the borrowing record
  - `user_id`: Foreign key to the user who reserved the book
  - `branch_id`: Foreign key to the library branch
  - `book_id`: Foreign key to the book being borrowed
  - `pin`: 6-digit numeric verification code (nullable)
  - `expired_at`: Timestamp when the PIN expires (nullable)
  - `status`: Enum (`reserved`, `pending`, `borrowed`, `returned`, `cancelled`)
  - `reserve_date`: Timestamp when the reservation was made
  - `due_date`: Timestamp when the book must be returned (set on confirmation)
  - `expired_reserve`: Derived attribute = `reserve_date + 7 days`
- **User**: Borrower profile with attributes: username, gender, phone number, email, account eligibility status.
- **Book**: Inventory item with attributes: title, author, publisher, genre, price, quantity (per branch).
- **Librarian**: Staff user with attribute: `branch_id` (assigned library branch).
- **Calendar Event**: A scheduling entry for the user, created with the due date upon loan confirmation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The complete workflow (PIN entry → branch check → details display → confirm/cancel) completes in under 5 seconds end-to-end.
- **SC-002**: PIN lookup returns results within 1 second of submission.
- **SC-003**: Branch mismatch and PIN-not-found errors return clear, user-friendly error messages — no raw system or database errors exposed.
- **SC-004**: Loan confirmation correctly sets `due_date` to exactly 14 days in the future 100% of the time.
- **SC-005**: Loan cancellation correctly increments book quantity by exactly 1 for the correct branch 100% of the time.
- **SC-006**: Rollback behaviour is verified: if any step in the confirm/cancel transaction fails, the entire transaction is rolled back with zero partial updates.
- **SC-007**: Borrower eligibility checks prevent loans for users with overdue violations or suspensions.

## Assumptions

- The existing `borrow_book` table structure already contains the `pin`, `expired_at`, `branch_id`, `expired_reserve` columns.
- The librarian's `branch_id` is retrievable from their authenticated session/profile.
- The `expired_reserve` field is a derived/computed column (reserve_date + 7 days), not a user-input field.
- Calendar events for due dates are stored in a separate events/calendar table that can be written to from the backend.
- The PIN verification and borrowing workflow is exclusively a backend operation — the frontend will consume these APIs via the existing `VerificationModal` and `InlinePinVerification` components.
- The existing code logic used for user-initiated reservation cancellation (deleting row, incrementing quantity) is reusable as a reference for the librarian-initiated cancellation.
- All database operations follow the existing project convention of raw SQL with parameterized queries via the `pg` pool.
