# Data Model: Book Management UI

## Overview

This document defines the data shapes for the 4-tab Book Management Dashboard. All entities are frontend-only (TypeScript interfaces) for mock data consumption. Backend integration will add corresponding database models and API contracts in a future iteration.

---

## Entities

### 1. BookEntry

A library resource displayed in the Book Management tab.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | `string` | Unique identifier | Required, non-empty |
| `coverSrc` | `string` | URL/path to book cover image | Required, valid image path |
| `title` | `string` | Book title | Required, non-empty |
| `author` | `string` | Author name | Required, non-empty |
| `isbn` | `string` | ISBN-13 identifier | Required, matches ISBN format |
| `category` | `string` | Book category/genre | Required |
| `available` | `number` | Number of copies currently available | Required, >= 0, <= total |
| `total` | `number` | Total copies owned | Required, > 0 |
| `active` | `boolean` | Whether book is active in catalog | Required |

**State transitions**: None (static catalog data)

**Derived values**:
- `availabilityLabel`: computed from `available`/`total` (e.g., "3 / 5 available")
- `availabilityVariant`: `'success'` if `available > 0`, `'error'` if `available === 0`

---

### 2. PickupEntry

A pending book reservation ready for student collection (Book Pickup tab).

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | `string` | Unique pickup identifier | Required, non-empty |
| `bookTitle` | `string` | Title of reserved book | Required |
| `bookISBN` | `string` | ISBN of reserved book | Required |
| `bookCover` | `string` | Book cover image path | Required |
| `studentName` | `string` | Student's full name | Required |
| `studentId` | `string` | Student ID number | Required |
| `studentAvatar` | `string` | Student avatar image path | Optional |
| `pin` | `string` | Pickup PIN (displayed masked) | Required, 6 digits |
| `createdAt` | `string` (ISO date) | When pickup was created | Required |
| `expiresAt` | `string` (ISO date) | PIN expiration timestamp | Required, > createdAt |
| `status` | `'pending' \| 'urgent' \| 'expired' \| 'redeemed'` | Current pickup status | Required |

**State transitions**:
```
pending --[time < 1hr remaining]--> urgent
pending/urgent --[expired]--> expired
pending/urgent --[redeemed]--> redeemed
```

**Derived values**:
- `timeRemaining`: computed from `expiresAt` - now (e.g., "42m 12s")
- `isUrgent`: `true` if remaining time < 1 hour, `false` otherwise

---

### 3. BorrowEntry

A checked-out book awaiting return (Book Return tab).

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | `string` | Unique borrow record ID | Required |
| `userAvatar` | `string` | Borrower avatar image | Optional |
| `userName` | `string` | Borrower full name | Required |
| `userId` | `string` | Borrower ID number | Required |
| `bookTitle` | `string` | Borrowed book title | Required |
| `bookCallNo` | `string` | Library call number | Required |
| `borrowDate` | `string` (ISO date) | When book was checked out | Required |
| `dueDate` | `string` (ISO date) | When book is due | Required, >= borrowDate |
| `status` | `'active' \| 'overdue'` | Current borrow status | Required |
| `fees` | `number` | Accumulated late/damage fees | Required, >= 0 |

**State transitions**:
```
active --[past dueDate]--> overdue
active/overdue --[marked returned]--> (removed, becomes inspection data)
```

**Derived values**:
- `daysOverdue`: computed from today - `dueDate` (only when overdue)
- `feeDisplay`: `$0.00` format with `.toFixed(2)`

---

### 4. InspectionEntry

A completed return transaction undergoing condition inspection (Inspection tab).

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `borrowId` | `string` | Reference to original borrow | Required |
| `borrowerName` | `string` | Borrower full name | Required |
| `borrowerAvatar` | `string` | Borrower avatar | Optional |
| `bookTitle` | `string` | Returned book title | Required |
| `bookCover` | `string` | Book cover image | Required |
| `isbn` | `string` | Book ISBN | Required |
| `borrowDate` | `string` (ISO date) | Original borrow date | Required |
| `dueDate` | `string` (ISO date) | Original due date | Required |
| `returnDate` | `string` (ISO date) | Actual return date | Required |
| `loanDuration` | `number` | Days between borrow and return | Required |
| `conditions` | `ConditionSelection[]` | Selected damage conditions | Optional, default empty |
| `notes` | `string` | Free-form inspection notes | Optional |
| `latePenalty` | `number` | Late return fee | Required, >= 0 |
| `totalRepairFee` | `number` | Sum of selected condition fees | Required, >= 0 |
| `finalRefund` | `number` | Deposit minus all fees | Required |

**State transitions**: None (read-only after calculation)

---

### 5. ConditionSelection

A damage category with fee for inspection.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | `string` | Condition identifier | Required |
| `name` | `string` | Display name | Required |
| `fee` | `number` | Associated repair fee | Required, >= 0 |
| `selected` | `boolean` | Whether this condition is checked | Required |

**Available conditions** (predefined):

| id | Name | Fee |
|----|------|-----|
| `perfect` | Perfect Condition | $0.00 |
| `cover_scratches` | Slight Cover Scratches | $2.00 |
| `folded_pages` | Folded Pages | $3.00 |
| `pencil_marks` | Pencil Marks | $5.00 |
| `torn_pages` | Torn Pages | $15.00 |
| `water_damage` | Water Damage | $20.00 |

---

### 6. KPIMetric

A KPI stat card data point (used in Book Pickup and Book Return tabs).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Metric identifier |
| `label` | `string` | Display label (e.g., "PENDING PICKUPS") |
| `value` | `number` | Current count |
| `trend` | `string` | Trend text (e.g., "+12% vs last week") |
| `trendVariant` | `'positive' \| 'negative' \| 'neutral'` | Trend color indicator |
| `progress` | `number` | Progress percentage (0-100) |
| `progressColor` | `string` | Tailwind color class for progress bar |
| `variant` | `'default' \| 'critical' \| 'success'` | Card visual variant |

---

## Entity Relationships

```
BookEntry (catalog)
   1 : N -- PickupEntry (reservations per book)
   1 : N -- BorrowEntry (borrowings per book)

PickupEntry
   N : 1 -- Student/User (via studentId)

BorrowEntry
   N : 1 -- Student/User (via userId)
   1 : 1 -- InspectionEntry (one inspection per borrow return)

InspectionEntry
   1 : N -- ConditionSelection (multiple conditions per inspection)
```

## Validation Rules Summary

| Rule | Applies To | Description |
|------|-----------|-------------|
| Availability bounds | `BookEntry` | `0 <= available <= total` |
| Date ordering | `BorrowEntry` | `borrowDate <= dueDate` |
| Fee non-negative | All fee fields | `fee >= 0` |
| PIN format | `PickupEntry` | `pin.length === 6`, digits only |
| Status enum | `PickupEntry`, `BorrowEntry` | Must be valid enum value |
| Derived overrides | `PickupEntry.status` | `status` must be `'urgent'` if remaining time < 1hr |
