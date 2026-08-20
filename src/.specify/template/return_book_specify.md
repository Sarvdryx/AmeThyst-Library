# Book Return & Inspection System Specification

## Overview
This specification outlines the complete book return workflow, including PIN verification, book inspection, penalty calculation, and payment processing.

---

## 1. PIN Verification Flow

### 1.1 User Side - Generate Return PIN
- **Location**: User's borrowed books page, on book cards with `status = "borrowed"`
- **Action**: Add "Generate Return PIN" button
- **Reuse**: existing PIN display on book reservation
- **PIN Properties**:
  - Validity: 3 minutes
  - No branch filter required (books can be returned at any branch)
- **Status Change**: While PIN is valid, book status displays as `"pending_return"`

### 1.2 Librarian Side - PIN Verification
- **Location**: Inspection tab
- **Reuse**: `InlinePinVerification` modal
- **Logic**: On successful PIN entry → render existing inspection UI
- **Query Filter**: Librarian queries only books with `status = "pending_return"`

---

## 2. Book Inspection Interface

### 2.1 Display Information
**User Information** (joined from `users` table via `borrow_book.user_id`):
- Username
- Gender
- Phone number
- Email
- Birth date

**Book Information** (joined from `books` table via `borrow_book.book_id`):
- Title
- Publisher
- Author
- Genres
- Image URL
- Price

**Borrowing Information** (from `borrow_book` table):
- Reserve date
- Borrow date
- Due date

### 2.2 Damage Assessment
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

**Interaction Rules**:
- Selecting "Perfect condition" disables all other condition buttons (and vice versa)
- Selecting "Lost" disables all other condition buttons (and vice versa)
- Description field is disabled by default, enabled only when damage conditions are selected

### 2.3 Penalty Calculation Formula
cost = (x * m_max) + Fee_admin + (N_errors - 1) * Fee_addon

text

**Variables**:
- `m_max`: Coefficient of the most severe damage in the list
- `N_errors`: Total number of damage conditions selected
- `Fee_admin`: Fixed processing fee
- `Fee_addon`: Additional fee per extra damage type
- **Cap**: Total cost cannot exceed the book's lost penalty amount
- **Perfect condition**: Cost = 0

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

**Overdue Penalty Formula** (applied when late + damaged):
overdue_cost = 5% * price + (x - 3) * 2% * price

text
Where `x` = number of overdue days, `price` = book price from `books` table

---

## 3. Database Operations on Return Confirmation

### 3.1 Inventory Update
- **Condition**: Book is in perfect condition
- **Action**: Increment `available_quantity` by 1 in `library` table
- **Match**: `book_id` = returned book AND `branch_id` = processing librarian's branch

### 3.2 Data Persistence Scenarios

| Scenario | Tables Affected | Notes |
|----------|----------------|-------|
| Perfect condition + On time | `return_book` only | Standard return |
| Lost book | `book_penalty` only | `return_id = NULL`, `penalty_amount` from formula |
| Damaged (any) | `return_book` + `book_penalty` | Both tables populated |
| Damaged + Overdue | `return_book` + `book_penalty` | `penalty_amount` = damage cost + overdue cost |

### 3.3 Schema Reference

**`return_book` Table**:
- `return_id` (PK, UUID)
- `borrow_id` (FK, Unique) - One return per borrow
- `branch_id` (FK) - Receiving branch (can differ from borrowing branch)
- `return_date` (Date) - Actual return date
- `is_overdue` (Boolean) - Compared against `due_date` at return time

**`book_penalty` Table**:
- `penalty_id` (PK, UUID)
- `borrow_id` (FK, Unique)
- `return_id` (FK, Nullable) - NULL if book is lost (no return record)
- `user_id` (FK) - For quick querying
- `issue` (Varchar) - Values: `OVERDUE`, `DAMAGED`, `LOST`, `COMBINED`
- `description` (Varchar, Nullable) - Damage details
- `record_date` (Date) - In-person confirmation date
- `penalty_amount` (Numeric)
- `is_paid` (Boolean, Default: false)
- `paid_at` (Timestamp, Nullable)

---

## 4. User Borrowing History

### 4.1 Display Component
- **Reuse**: Existing `BorrowedHistoryTable` UI
- **Data Source**: `return_book` table

### 4.2 Rendered Information
**From `return_book`** (joined with `branches` via `branch_id`):
- Branch name

**From `return_book`**:
- Return date
- Overdue status (based on `is_overdue`)

**Book Information** (joined chain: `return_book` → `borrow_book` via `borrow_id` → `books` via `book_id`):
- Image URL
- Title
- Author

---

## 5. Payment & Debt Management

### 5.1 Librarian Dashboard - "Loan & Fees" Tab
- **Location**: Books tab → New sub-tab "Loan & Fees"
- **Functionality**:
  - Display users with outstanding debts (`is_paid = false` in `book_penalty`)
  - Search by username
  - Confirm payment button for librarian

### 5.2 User Side - Fees Tab
- **Display**:
  - Payment history (paid penalties)
  - Current outstanding debts (unpaid penalties)
- **Filter**: Based on `is_paid` column in `book_penalty`

### 5.3 Payment Flow
1. User provides their username to librarian
2. Librarian searches in "Loan & Fees" tab
3. Librarian confirms payment
4. System updates `is_paid = true` and `paid_at = current_timestamp`
5. User's Fees tab reflects updated status

---

## 6. Key Considerations
- All existing code must remain untouched
- Remove all mock data
- Synchronize logic between User Fees tab and Librarian Loan & Fees tab
- PIN verification must be reusable across borrow and return flows
- Branch filtering removed for return PIN generation only
- If there is any UI that is not implemented, please resolve
- Remember to declare clear server architecture for me (routes, services, controllers,...)