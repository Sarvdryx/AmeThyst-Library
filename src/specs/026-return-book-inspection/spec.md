# Feature Specification: Book Return & Inspection System

**Feature Branch**: `026-return-book-inspection`

**Created**: 2026-07-21

**Status**: Draft

**Input**: System specification for the complete book return workflow, including PIN verification, book inspection, penalty calculation, and payment processing derived from `.specify/template/return_book_specify.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Return PIN (Priority: P1)

As a user with a borrowed book, I want to generate a return PIN from my borrowed books page so that I can initiate the return process at any library branch.

**Why this priority**: PIN generation is the entry point for the entire return workflow; without it, no return can proceed.

**Independent Test**: Can be fully tested by navigating to the borrowed books page, locating a book card with `status = "borrowed"`, clicking "Generate Return PIN", and verifying a valid PIN is generated with a 3-minute expiry.

**Acceptance Scenarios**:

1. **Given** a user is on their borrowed books page, **When** they view a book card with `status = "borrowed"`, **Then** a "Generate Return PIN" button is displayed on that card.
2. **Given** the user clicks "Generate Return PIN", **When** the system generates the PIN, **Then** the PIN is valid for 3 minutes.
3. **Given** a return PIN is valid, **When** the system updates the book status, **Then** the book status displays as `"pending_return"` while the PIN is valid.
4. **Given** a return PIN has been generated, **When** the user is at any library branch, **Then** no branch filter is required — books can be returned at any branch.
5. **Given** the existing PIN display on book reservation, **When** implementing the return PIN, **Then** the same PIN display UI is reused.

---

### User Story 2 - Librarian PIN Verification (Priority: P1)

As a librarian, I want to verify a user's return PIN on the Inspection tab so that I can authenticate the return before inspecting the book.

**Why this priority**: PIN verification gates access to the inspection interface; without it, librarians cannot proceed to assess book condition.

**Independent Test**: Can be fully tested by navigating to the Inspection tab, entering a valid return PIN, and verifying the inspection UI renders with correct user and book details.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Inspection tab, **When** they enter a return PIN, **Then** the existing `InlinePinVerification` modal is used for PIN entry.
2. **Given** a valid return PIN is entered, **When** verification succeeds, **Then** the existing inspection UI is rendered with the corresponding borrowing record data.
3. **Given** the librarian is on the Inspection tab, **When** they query books, **Then** only books with `status = "pending_return"` are displayed in the query filter.

---

### User Story 3 - Book Condition Assessment (Priority: P1)

As a librarian, after PIN verification, I want to inspect the returned book and select its condition from a predefined list so that any damage is properly documented for penalty calculation.

**Why this priority**: Damage assessment determines penalty amounts and inventory updates; it is the core inspection function.

**Independent Test**: Can be fully tested by selecting each condition type and verifying the UI response, interaction rules, and penalty formula output.

**Acceptance Scenarios**:

1. **Given** the inspection UI is displayed, **When** viewing user information, **Then** it shows username, gender, phone number, email, and birth date (joined from `users` table via `borrow_book.user_id`).
2. **Given** the inspection UI is displayed, **When** viewing book information, **Then** it shows title, publisher, author, genres, image URL, and price (joined from `books` table via `borrow_book.book_id`).
3. **Given** the inspection UI is displayed, **When** viewing borrowing information, **Then** it shows reserve date, borrow date, and due date (from `borrow_book` table).
4. **Given** the librarian is assessing condition, **When** they select "Perfect condition", **Then** all other condition buttons are disabled.
5. **Given** the librarian is assessing condition, **When** they select "Lost", **Then** all other condition buttons are disabled.
6. **Given** the librarian is assessing condition, **When** they select any damage condition (other than "Perfect condition" or "Lost"), **Then** the description field is enabled for entering damage details.
7. **Given** the librarian has not selected any damage conditions, **When** viewing the description field, **Then** the description field is disabled by default.
8. **Given** the librarian selects any condition, **When** the selection changes, **Then** the mutual exclusion rules are enforced: "Perfect condition" and "Lost" each disable all other options; damage conditions can be combined with each other but not with "Perfect condition" or "Lost".

**Available Conditions**:
1. Perfect condition
2. Slight cover scratches
3. Folded pages
4. Pencil marks
5. Ink marks
6. Torn pages
7. Water damage
8. Damaged binding
9. Missing mats
10. Missing pages
11. Lost

---

### User Story 4 - Penalty Calculation & Return Confirmation (Priority: P1)

As a librarian, after assessing the book condition, I want the system to calculate the correct penalty based on the damage and overdue status so that the user is charged accurately before the return is finalized.

**Why this priority**: Penalty calculation directly impacts financial accuracy and user trust; incorrect calculations would cause disputes.

**Independent Test**: Can be fully tested by selecting various damage combinations and verifying the calculated penalty against the formula.

**Acceptance Scenarios**:

1. **Given** the librarian has assessed the condition, **When** the book is in perfect condition, **Then** the calculated cost is 0.
2. **Given** the librarian has selected one or more damage conditions, **When** the system calculates the penalty, **Then** it uses the formula: `cost = (x * m_max) + Fee_admin + (N_errors - 1) * Fee_addon` where `m_max` is the coefficient of the most severe damage, `N_errors` is the total number of damage conditions selected, `Fee_admin` is a fixed processing fee, and `Fee_addon` is an additional fee per extra damage type.
3. **Given** the calculated cost exceeds the book's lost penalty amount, **When** the system applies the cap, **Then** the total cost does not exceed the book's lost penalty amount.
4. **Given** the book is returned late and damaged, **When** the system calculates the overdue penalty, **Then** it uses the formula: `overdue_cost = 5% * price + (x - 3) * 2% * price` where `x` = number of overdue days, `price` = book price from `books` table.
5. **Given** the book is returned late and damaged, **When** the total penalty is calculated, **Then** `penalty_amount` = damage cost + overdue cost.

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

---

### User Story 5 - Database Operations on Return Confirmation (Priority: P1)

As a system, when a return is confirmed, I want to correctly update the inventory and persist the return and penalty records so that data integrity is maintained across all scenarios.

**Why this priority**: Database operations are the authoritative record of all transactions; incorrect persistence would corrupt the system state.

**Independent Test**: Can be fully tested by processing returns in each scenario and verifying the affected tables contain correct records.

**Acceptance Scenarios**:

1. **Given** the book is returned in perfect condition and on time, **When** the return is confirmed, **Then** only the `return_book` table is affected.
2. **Given** the book is lost, **When** the return is processed, **Then** only the `book_penalty` table is populated with `return_id = NULL` and `penalty_amount` calculated from the formula.
3. **Given** the book is returned damaged (any damage level), **When** the return is confirmed, **Then** both `return_book` and `book_penalty` tables are populated.
4. **Given** the book is returned damaged and overdue, **When** the return is confirmed, **Then** both `return_book` and `book_penalty` tables are populated with `penalty_amount` = damage cost + overdue cost.
5. **Given** the book is in perfect condition, **When** the return is confirmed, **Then** `available_quantity` is incremented by 1 in the `library` table for the matching `book_id` and the processing librarian's `branch_id`.

---

### User Story 6 - User Borrowing History (Priority: P2)

As a user, I want to view my borrowing history including return dates and overdue status so that I can track my past borrows.

**Why this priority**: Borrowing history is important for user transparency but does not block the primary return workflow.

**Independent Test**: Can be fully tested by navigating to the borrowing history page and verifying the return information is displayed correctly.

**Acceptance Scenarios**:

1. **Given** the user navigates to their borrowing history, **When** viewing the history list, **Then** the existing `BorrowedHistoryTable` UI is reused.
2. **Given** a return record exists, **When** viewing the history entry, **Then** it displays: branch name (from `return_book` joined with `branches` via `branch_id`), return date, overdue status (based on `is_overdue`).
3. **Given** a return record exists, **When** viewing book information in the history, **Then** it displays: image URL, title, and author (joined chain: `return_book` -> `borrow_book` via `borrow_id` -> `books` via `book_id`).

---

### User Story 7 - Payment & Debt Management (Priority: P1)

As a librarian, I want to view and manage outstanding debts so that I can track unpaid penalties and confirm payments.

**Why this priority**: Debt management ensures the library collects penalties owed; uncollected debts undermine the penalty system.

**Independent Test**: Can be fully tested by navigating to the "Loan & Fees" tab and verifying outstanding debts are displayed, searchable, and payable.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Books tab, **When** they navigate to "Loan & Fees" sub-tab, **Then** users with outstanding debts (`is_paid = false` in `book_penalty`) are displayed.
2. **Given** the librarian is on the "Loan & Fees" tab, **When** they type in the search field, **Then** results are filtered by username.
3. **Given** the librarian finds a user with an outstanding debt, **When** they click the confirm payment button, **Then** the system updates `is_paid = true` and `paid_at = current_timestamp` in the `book_penalty` table.
4. **Given** a user is viewing their Fees tab, **When** the page loads, **Then** payment history (paid penalties) and current outstanding debts (unpaid penalties) are displayed, filtered by the `is_paid` column in `book_penalty`.
5. **Given** a payment is confirmed by the librarian, **When** the user's Fees tab is viewed, **Then** the updated status is reflected.

**Payment Flow**:
1. User provides their username to librarian
2. Librarian searches in "Loan & Fees" tab
3. Librarian confirms payment
4. System updates `is_paid = true` and `paid_at = current_timestamp`
5. User's Fees tab reflects updated status

---

### Edge Cases

- What happens if the return PIN expires before the librarian verifies it? The PIN becomes invalid and the user must generate a new one.
- What happens if a book is returned to a branch different from where it was borrowed? This is allowed — no branch filter is required for return PIN.
- What happens if "Perfect condition" and another damage condition are both attempted to be selected? The mutual exclusion rule prevents this — selecting "Perfect condition" disables all other condition buttons.
- What happens if "Lost" is selected alongside other damage conditions? "Lost" disables all other condition buttons, so no other conditions can be selected.
- What happens if the calculated penalty exceeds the book's lost penalty amount? The system caps the total cost at the book's lost penalty amount.
- What happens if a return is attempted for a book that is already in `pending_return` status? The system should handle this gracefully (PIN already active).
- What happens if the librarian searches for a username that has no outstanding debts? The search should return an empty result.
- What happens if the library branch has no available quantity record for the returned book? The increment operation should create or update the record.
- What happens if `return_id` is NULL in `book_penalty`? This indicates a lost book scenario where no return record exists.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "Generate Return PIN" button on each borrowed book card with `status = "borrowed"` on the user's borrowed books page.
- **FR-002**: The generated return PIN MUST have a validity period of exactly 3 minutes.
- **FR-003**: While a valid return PIN exists, the system MUST display the book status as `"pending_return"`.
- **FR-004**: Return PINs MUST be usable at any library branch (no branch filter restriction).
- **FR-005**: The system MUST reuse the existing PIN display UI from the book reservation flow for the return PIN display.
- **FR-006**: The librarian-facing Inspection tab MUST reuse the existing `InlinePinVerification` modal for return PIN entry.
- **FR-007**: On successful PIN entry in the Inspection tab, the system MUST render the existing inspection UI with the corresponding borrowing record.
- **FR-008**: The librarian query filter on the Inspection tab MUST only show books with `status = "pending_return"`.
- **FR-009**: The inspection UI MUST display user information (username, gender, phone number, email, birth date) joined from `users` table via `borrow_book.user_id`.
- **FR-010**: The inspection UI MUST display book information (title, publisher, author, genres, image URL, price) joined from `books` table via `borrow_book.book_id`.
- **FR-011**: The inspection UI MUST display borrowing information (reserve date, borrow date, due date) from the `borrow_book` table.
- **FR-012**: The system MUST provide a damage assessment interface with exactly 11 condition options: Perfect condition, Slight cover scratches, Folded pages, Pencil marks, Ink marks, Torn pages, Water damage, Damaged binding, Missing mats, Missing pages, Lost.
- **FR-013**: Selecting "Perfect condition" MUST disable all other condition buttons.
- **FR-014**: Selecting "Lost" MUST disable all other condition buttons.
- **FR-015**: The description field MUST be disabled by default and enabled only when damage conditions (other than "Perfect condition" or "Lost") are selected.
- **FR-016**: The penalty calculation MUST use the formula: `cost = (x * m_max) + Fee_admin + (N_errors - 1) * Fee_addon` where `m_max` is the coefficient of the most severe damage selected, `N_errors` is the total number of damage conditions selected.
- **FR-017**: The total penalty cost MUST be capped at the book's lost penalty amount.
- **FR-018**: For books in perfect condition, the cost MUST be 0.
- **FR-019**: When a book is returned overdue and damaged, the overdue penalty MUST be calculated as: `overdue_cost = 5% * price + (x - 3) * 2% * price` where `x` = overdue days and `price` = book price.
- **FR-020**: When both damage and overdue penalties apply, the `penalty_amount` MUST be the sum of damage cost and overdue cost.
- **FR-021**: When a book is returned in perfect condition and on time, the system MUST only insert a record into the `return_book` table.
- **FR-022**: When a book is lost, the system MUST only insert a record into the `book_penalty` table with `return_id = NULL` and `penalty_amount` from the formula.
- **FR-023**: When a book is returned damaged (any level), the system MUST insert records into both `return_book` and `book_penalty` tables.
- **FR-024**: When a book is returned damaged and overdue, the system MUST insert records into both `return_book` and `book_penalty` tables with `penalty_amount` = damage cost + overdue cost.
- **FR-025**: For books in perfect condition, the system MUST increment `available_quantity` by 1 in the `library` table where `book_id` matches the returned book AND `branch_id` matches the processing librarian's branch.
- **FR-026**: The system MUST reuse the existing `BorrowedHistoryTable` UI component for displaying borrowing history.
- **FR-027**: The borrowing history MUST display branch name (from `return_book` joined with `branches`), return date, and overdue status.
- **FR-028**: The borrowing history MUST display book image URL, title, and author (joined chain: `return_book` -> `borrow_book` -> `books`).
- **FR-029**: The librarian's "Books" tab MUST include a new sub-tab called "Loan & Fees".
- **FR-030**: The "Loan & Fees" tab MUST display users with outstanding debts (`is_paid = false` in `book_penalty`).
- **FR-031**: The "Loan & Fees" tab MUST support searching by username.
- **FR-032**: The "Loan & Fees" tab MUST include a confirm payment button for the librarian.
- **FR-033**: On payment confirmation, the system MUST update `is_paid = true` and `paid_at = current_timestamp` in the `book_penalty` table.
- **FR-034**: The user's Fees tab MUST display payment history (paid penalties) and current outstanding debts (unpaid penalties) filtered by `is_paid`.
- **FR-035**: The user's Fees tab MUST reflect updated payment status after the librarian confirms payment.
- **FR-036**: The payment flow MUST follow: user provides username to librarian -> librarian searches -> librarian confirms payment -> system updates -> user sees updated status.
- **FR-037**: All existing code MUST remain untouched — new features must be additive only.
- **FR-038**: All mock data MUST be removed.
- **FR-039**: The logic between the User Fees tab and the Librarian Loan & Fees tab MUST be synchronized.
- **FR-040**: PIN verification MUST be reusable across both borrow and return flows.
- **FR-041**: The server-side PIN lookup query (`findBorrowRecordByPin`) MUST be shared between the borrow and return flows, with the `status` filter passed as a parameter (e.g., `'pending'` for borrow, `'pending_return'` for return) rather than hardcoded.
- **FR-042**: Branch filtering MUST be removed specifically for return PIN generation only.

### Key Entities *(include if feature involves data)*

- **Return Record (`return_book`)**:
  - `return_id`: Primary key (UUID)
  - `borrow_id`: Foreign key (Unique) — one return per borrow
  - `branch_id`: Foreign key — receiving branch (can differ from borrowing branch)
  - `return_date`: Date — actual return date
  - `is_overdue`: Boolean — compared against `due_date` at return time

- **Book Penalty (`book_penalty`)**:
  - `penalty_id`: Primary key (UUID)
  - `borrow_id`: Foreign key (Unique)
  - `return_id`: Foreign key (Nullable) — NULL if book is lost (no return record)
  - `user_id`: Foreign key — for quick querying
  - `issue`: Varchar — values: `OVERDUE`, `DAMAGED`, `LOST`, `COMBINED`
  - `description`: Varchar (Nullable) — damage details
  - `record_date`: Date — in-person confirmation date
  - `penalty_amount`: Numeric
  - `is_paid`: Boolean (Default: false)
  - `paid_at`: Timestamp (Nullable)

- **Borrow Record (`borrow_book`)**: Referenced entity with fields: `borrow_id` (PK), `user_id` (FK), `book_id` (FK), `status` (includes `"borrowed"`, `"pending_return"`), `reserve_date`, `borrow_date`, `due_date`.

- **User**: Borrower profile with attributes: username, gender, phone number, email, birth date.

- **Book**: Inventory item with attributes: title, publisher, author, genres, image URL, price.

- **Library Branch**: Referenced entity with attributes: `branch_id`, `branch_name`.

- **Library Inventory (`library`)**: Junction table with attributes: `book_id`, `branch_id`, `available_quantity`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The complete return workflow (PIN generation -> verification -> inspection -> penalty calculation -> confirmation) completes in under 10 seconds end-to-end.
- **SC-002**: Return PIN generation and display takes under 1 second from user click.
- **SC-003**: PIN verification returns results within 1 second of submission.
- **SC-004**: Penalty calculations match the defined formulas 100% of the time across all condition combinations.
- **SC-005**: The total penalty cost never exceeds the book's lost penalty amount.
- **SC-006**: Database persistence across all return scenarios (perfect+on-time, lost, damaged, damaged+overdue) is verified with zero partial updates or data corruption.
- **SC-007**: Inventory quantity updates are accurate for the correct book and branch 100% of the time.
- **SC-008**: The user's borrowing history accurately reflects all completed returns with correct dates, branch names, and overdue status.
- **SC-009**: Outstanding debts display and payment confirmation updates are synchronized between the Librarian Loan & Fees tab and the User Fees tab.
- **SC-010**: All existing library features continue to function after the return workflow is deployed (backward compatibility verified).

## Assumptions

- The `borrow_book` table already supports the `status = "pending_return"` value or can be extended to support it.
- The existing `InlinePinVerification` modal is compatible with the return flow (it was originally used for borrow PIN verification).
- The existing `BorrowedHistoryTable` component can be extended to display return-related data from the `return_book` table.
- The `Fee_admin` and `Fee_addon` values are configurable constants defined elsewhere in the system (not specified in the template).
- The lost penalty amount per book is a stored value accessible for the cap calculation.
- The `library` table already has rows for each `book_id` + `branch_id` combination; the increment operation assumes the row exists.
- The `book_penalty.issue` field uses the values `OVERDUE`, `DAMAGED`, `LOST`, `COMBINED` as string enum values.
- The borrowing history join chain (`return_book` -> `borrow_book` -> `books`) follows existing project conventions for table relationships.
- All database operations follow the existing project convention for data access patterns.
- The server architecture will include clear separation into routes, services, and controllers as per project convention.

## Reusable Assets

### Server-side Functions

| Function | File | Pattern to Follow | How to Reuse |
|----------|------|-------------------|-------------|
| `findBorrowRecordByPin(pin, status)` | `server/src/services/dashboard.librarian.services.mjs:7` | Parameterized SQL via `pool.query` | Already updated to accept `status` param — call with `'pending_return'` for return PIN verification |
| `verifyPin(pin, librarianBranchId)` | `server/src/services/dashboard.librarian.services.mjs:84` | PIN lookup → branch check → return user+book details | Adapt to skip branch check for return flow (returns allowed at any branch) |
| `generatePickupPin(userId, borrowId)` | `server/src/services/dashboard.user.services.mjs:4` | 6-digit random PIN, uniqueness retry (3 attempts), 3-min expiry, status update | Reuse pattern for return PIN generation — change status to `'pending_return'`, omit branch constraint |
| `confirmBorrowing(borrowId)` | `server/src/services/dashboard.librarian.services.mjs:125` | Transaction-based state mutation with `pool.connect()` + `BEGIN/COMMIT/ROLLBACK` | Follow transaction pattern for return confirmation + penalty persistence |
| `cancelBorrowing(borrowId)` | `server/src/services/dashboard.librarian.services.mjs` | Compensating transaction pattern | Reference for rollback logic |
| `cleanupExpiredPins()` | `server/src/services/library.services.mjs:318` | Batch cleanup of expired PINs via status + timestamp check | Extend to also clean up `'pending_return'` PINs |
| `clearAllPins()` | `server/src/services/library.services.mjs:336` | Flush all pending PINs on startup | Extend to include `'pending_return'` status |

### Client-side Components

| Component | File | How to Reuse |
|-----------|------|-------------|
| `InlinePinVerification` | `client/app/components/organisms/InlinePinVerification.tsx` | Reuse directly for return PIN entry on Inspection tab (FR-006) |
| `OTPInput` | `client/app/components/atoms/OTPInput.tsx` | PIN input atom, already used by `InlinePinVerification` |
| `BorrowedHistoryTable` | (existing component) | Reuse for borrowing history display (FR-026) |
| PIN display UI | (from reservation/borrow flow) | Reuse the same component for return PIN display on user's borrowed books page (FR-005) |

### Architecture Pattern

All return endpoints follow the same route structure as the existing borrow workflow:

| Layer | File | Pattern |
|-------|------|---------|
| Route | `server/src/routes/dashboard.librarian.routes.mjs` | `router.post('/endpoint', verifyToken, authorizeRole('librarian'), handler)` |
| Controller | `server/src/controllers/dashboard.librarian.controllers.mjs` | Extract params from `req.body` / `req.user`, call service, return JSON response |
| Service | `server/src/services/dashboard.librarian.services.mjs` | Business logic + database queries via `pool.query()` |
| Database | PostgreSQL via `pg` pool | Parameterized SQL queries (`$1`, `$2`) |

### Database Tables (Already Exist)

| Table | Purpose |
|-------|---------|
| `return_book` | Stores return records (`return_id`, `borrow_id`, `branch_id`, `return_date`, `is_overdue`) |
| `book_penalty` | Stores penalty records (`penalty_id`, `borrow_id`, `return_id`, `user_id`, `issue`, `description`, `record_date`, `penalty_amount`, `is_paid`, `paid_at`) |
| `borrow_book` | Source of PIN/status data; status values include `'borrowed'`, `'pending'`, `'pending_return'` |

## Conversion Audit Checklist

- Overview: Complete book return workflow - PRESENT
- Section 1: PIN Verification Flow (User Generate + Librarian Verify) - PRESENT
- Section 2: Book Inspection Interface (Display Info + Damage Assessment + Penalty Formula) - PRESENT
- Section 3: Database Operations on Return Confirmation (Inventory Update + Scenarios + Schema) - PRESENT
- Section 4: User Borrowing History (Display + Rendered Info) - PRESENT
- Section 5: Payment & Debt Management (Librarian Dashboard + User Fees + Payment Flow) - PRESENT
- Section 6: Key Considerations (existing code untouched, mock data removal, synchronization, reusability, architecture) - PRESENT
- Damage Coefficients table - PRESENT
- Penalty Calculation Formula - PRESENT
- Overdue Penalty Formula - PRESENT
- `return_book` table schema - PRESENT
- `book_penalty` table schema - PRESENT
