# Component Interface Contracts: Librarian PIN Verification UI

## Overview

This document defines the React component interfaces (props contracts), state shapes, and event contracts for the Librarian PIN Verification UI feature. All components follow the existing project conventions (Atomic Design, i18n via `t()` hook, Tailwind dark mode classes).

## Figma Redesign Component Tree (added 2026-06-30)

The Figma export introduces a comprehensive librarian dashboard. The component hierarchy follows Atomic Design:

```
Page: /dashboard/librarian
└── LibrarianDashboardLayout (Template)
    ├── NavBar (Organism) — updated with bell icon + user avatar
    ├── [Flex row]
    │   ├── LibrarianDashboardSidebar (Organism) — LIBRARIAN header + nav items
    │   └── <children> (page content)
    └── Footer (Organism)

Page: /dashboard/librarian (Books — default)
└── LibrarianBookManagement (Organism)
    ├── SubTabBar (Molecule) — book management / pickup / return / inspection
    ├── Search bar + Category dropdown + Add Book button
    ├── Book table
    │   ├── BookTableHeader (Molecule) — column labels
    │   ├── BookTableRow (Molecule) — data rows ×N
    │   │   ├── AvailabilityBadge (Atom) — "X / Y available" pill
    │   │   └── StatusDot (Atom) — green/gray dot
    │   └── BookTablePagination (Molecule) — page nav
    └── (table wrapper)
```

## New Atom Components

### 1. AvailabilityBadge

**File**: `client/app/components/atoms/AvailabilityBadge.tsx`

```typescript
interface AvailabilityBadgeProps {
  available: number;
  total: number;
}
```

- Green background + teal text when `available > 0`
- Neutral background + dark text when `available === 0`
- Text format: `"{available} / {total} available"`

### 2. StatusDot

**File**: `client/app/components/atoms/StatusDot.tsx`

```typescript
interface StatusDotProps {
  active: boolean;
}
```

- Green dot (`#5EEAD4`) when `active === true`
- Gray dot (`#74777D`) when `active === false`

## New Molecule Components

### 1. SubTabBar

**File**: `client/app/components/molecules/SubTabBar.tsx`

```typescript
interface SubTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```

Tabs: `book_management`, `book_pickup`, `book_return`, `inspection`

- Active tab: bottom border black, font-black weight
- Inactive: font-bold, hover effect

### 2. BookTableHeader

**File**: `client/app/components/molecules/BookTableHeader.tsx`

Static component — renders column labels from i18n keys.

Columns: Cover, Title, Author, ISBN, Category, Availability, Status, Actions

### 3. BookTableRow

**File**: `client/app/components/molecules/BookTableRow.tsx`

```typescript
interface BookEntry {
  coverSrc: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: number;
  total: number;
  active: boolean;
}

interface BookTableRowProps {
  book: BookEntry;
  hasBorder?: boolean;
}
```

### 4. BookTablePagination

**File**: `client/app/components/molecules/BookTablePagination.tsx`

```typescript
interface BookTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

## New Organism Components

### 1. LibrarianBookManagement

**File**: `client/app/components/organisms/LibrarianBookManagement.tsx`

Self-contained organism that assembles the book management view:
- Sub-tab navigation
- Search bar + category dropdown + Add Book button
- Book table with header, rows, pagination
- Uses mock data internally (no backend integration)

## 1. OTPInput (Atom)

**File**: `client/app/components/atoms/OTPInput.tsx`

### Props Contract

```typescript
interface OTPInputProps {
  /** Current 6-digit value as a concatenated string */
  value: string;
  /** Called on every digit change */
  onChange: (value: string) => void;
  /** Called when exactly 6 digits are entered */
  onComplete: (value: string) => void;
  /** Disable all interaction */
  disabled?: boolean;
  /** Show error state (red borders) */
  error?: boolean;
  /** Auto-focus first slot on mount */
  autoFocus?: boolean;
}
```

### Behavior Contract

| Behavior | Specification |
|----------|---------------|
| Slot count | Exactly 6 digit slots |
| Input mode | Each slot accepts exactly 1 digit (0-9) |
| Auto-advance | After typing a digit, focus moves to next empty slot |
| Masking | Each digit is masked as "•" after the next digit is entered (or after 500ms) |
| Backspace | On empty slot, moves focus to previous slot and clears it |
| Paste | Accepts exactly 6 digits pasted at once, distributes across slots |
| Error state | All 6 slots show `border-red-500` outline with error message below |
| Disabled state | All slots show `opacity-50`, no interaction |
| Auto-focus | First slot receives focus on mount when `autoFocus` is true |

### Visual Contract

- Each slot: 48×56px rounded rectangle, centered text, `text-2xl font-mono`
- Normal: `border-[#E8E2D5] dark:border-neutral-700 bg-white dark:bg-neutral-800`
- Focused: `border-amber-500 dark:border-amber-400 ring-1 ring-amber-500`
- Error: `border-red-500 dark:border-red-400`
- Disabled: `opacity-50 cursor-not-allowed`
- Container: `flex gap-2 justify-center`

---

## 2. VerificationModal (Organism)

**File**: `client/app/components/organisms/VerificationModal.tsx`

### Props Contract

```typescript
interface VerificationModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when modal is dismissed (Esc, Cancel, backdrop click) */
  onClose: () => void;
  /** Called when loan is confirmed with borrower data */
  onConfirm: (borrowerData: BorrowerInfo) => void;
}
```

### State Contract (internal)

```typescript
type ModalPhase = 'input' | 'loading' | 'data' | 'error';

interface VerificationModalState {
  phase: ModalPhase;
  pinValue: string;
  borrowerData: BorrowerInfo | null;
  booksData: BookInfo[];
  errorMessage: string | null;
}
```

### Keyboard Shortcut Contract

| Key | Phase | Action |
|-----|-------|--------|
| `Escape` | Any | Calls `onClose`, cleans up |
| `Enter` | input | Submits PIN validation (if 6 digits entered) |
| `F8` | data | Triggers `onConfirm(borrowerData)` |
| `Ctrl+Enter` | data | Triggers `onConfirm(borrowerData)` |

### Visual Contract

- Fixed overlay: `fixed inset-0 z-50 flex items-center justify-center`
- Backdrop: `bg-black/50` with click-to-close
- Modal container: `bg-[#F8EFE6] dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`
- Header: title text + `[X]` close button, `sticky top-0`
- Body: switches between input, loading (skeleton), data (dual-column), and error states
- Footer: Cancel (flat/gray) + Confirm (accent green/blue) buttons, `sticky bottom-0`

---

## 3. LibrarianDashboardSidebar (Organism)

**File**: `client/app/components/organisms/LibrarianDashboardSidebar.tsx`

### Props Contract

```typescript
interface LibrarianDashboardSidebarProps {
  /** Currently active tab for highlight */
  activeTab: 'calendar' | 'loan-confirmation';
  /** Called when user clicks a nav item */
  onTabChange: (tab: string) => void;
}
```

### Nav Items Contract

| Key | Label (i18n) | Path | Active | Icon |
|-----|-------------|------|--------|------|
| `calendar` | `t('librarian.sidebar.calendar')` | `/dashboard/librarian` | Path exact match | Calendar grid SVG |
| `loan-confirmation` | `t('librarian.sidebar.loan_confirmation')` | `/dashboard/librarian/loan-confirmation` | Path prefix match | Clipboard-check SVG |
| `inventory` | `t('librarian.sidebar.inventory_placeholder')` | — | Always inactive | Box SVG (placeholder) |
| `analytics` | `t('librarian.sidebar.analytics_placeholder')` | — | Always inactive | Chart SVG (placeholder) |

### Visual Contract

- Same width as existing `DashboardSidebar` (`w-64`)
- Same styling pattern: `bg-white dark:bg-neutral-900 border-r border-[#E8E2D5] dark:border-neutral-700`
- Nav links: `flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg`
- Active state: `bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400`
- Inactive state: `text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800`
- Placeholder items: `opacity-40 cursor-not-allowed` with "Coming Soon" tooltip

---

## 4. BookLoanConfirmationPanel (Organism)

**File**: `client/app/components/organisms/BookLoanConfirmationPanel.tsx`

### Props Contract

```typescript
interface BookLoanConfirmationPanelProps {
  // No external props — self-contained page component
}
```

### State Contract (internal)

```typescript
interface BookLoanConfirmationPanelState {
  isModalOpen: boolean;
}
```

### Behavior Contract

- Renders workspace header with description
- "Open Confirmation Modal" `Button` atom triggers `VerificationModal`
- On modal confirm: shows success `Toast`, resets for next transaction
- On modal close without confirm: resets without toast

---

## 5. BorrowerInfoPanel (Molecule)

**File**: `client/app/components/molecules/BorrowerInfoPanel.tsx`

### Props Contract

```typescript
interface BorrowerInfoPanelProps {
  borrower: BorrowerInfo;
  books: BookInfo[];
  isLoading?: boolean;
}

interface BorrowerInfo {
  fullName: string;
  libraryId: string;
  department: string;
  eligibility: 'eligible' | 'suspended';
}

interface BookInfo {
  title: string;
  author: string;
  bookCode: string;
  coverUrl: string | null;
}
```

### Visual Contract

- Two-column flex layout with `grid grid-cols-1 md:grid-cols-2 gap-6`
- Left column: borrower profile card
  - Name: `text-lg font-bold` (emphasized weight)
  - ID + Department: `text-sm text-neutral-500`
  - Badge: `StatusBadge` atom (green for eligible, red for suspended)
- Right column: scrollable book list
  - Each item: `flex gap-3 p-3 rounded-lg` with thumbnail placeholder, title, author, book code
  - "Registered Books ({count})" header
- Loading state: pulsing skeleton placeholders for each field

---

## 6. CalendarView (Molecule)

**File**: `client/app/components/molecules/CalendarView.tsx`

### Props Contract

```typescript
interface CalendarViewProps {
  events?: CalendarEvent[];
}

interface CalendarEvent {
  date: string;           // ISO date string (YYYY-MM-DD)
  type: 'pickup' | 'overdue' | 'library_event';
  title: string;
}
```

### Behavior Contract

- Wraps existing `DashboardCalendar` molecule
- Maps librarian event types to `DashboardCalendar` event format
- Uses existing color legend: green (`#009484`) for pickups, red (`#BA1A1A`) for overdue
- Side panel on date click shows event summary list

---

## 7. UI State Flow Contract

```typescript
// Verification Modal Lifecycle
type VerificationLifecycle =
  | { phase: 'idle' }
  | { phase: 'input'; pinValue: string }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'data'; borrower: BorrowerInfo; books: BookInfo[] }
  | { phase: 'confirming' }
  | { phase: 'done' };

// Transitions:
// idle → input           (modal opened)
// input → loading        (PIN submitted)
// loading → data         (validation success)
// loading → error        (validation failure)
// error → input          (retry)
// data → confirming      (confirm button pressed)
// confirming → done      (confirmation processed)
// any → idle             (modal closed)
```

## 8. Dashboard Layout Contracts

```typescript
// dashboard/librarian/layout.tsx
// Reuses existing NavBar + Footer components
// Uses LibrarianDashboardSidebar instead of DashboardSidebar
// Wraps children in main content area

// dashboard/librarian/page.tsx (Calendar View)
// Renders CalendarView molecule

// dashboard/librarian/loan-confirmation/page.tsx
// Renders BookLoanConfirmationPanel organism
```
