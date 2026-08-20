# Data Model: Librarian PIN Verification UI

## UI Component Tree

```
dashboard/librarian/layout.tsx
├── NavBar (existing organism)
├── LibrarianDashboardSidebar (new organism)
│   ├── NavLink (existing atom) x2
│   └── Placeholder zone (future tabs)
├── {children}
│   ├── page.tsx — Calendar View
│   │   └── CalendarView (new molecule)
│   │       └── DashboardCalendar (existing molecule)
│   │           └── Calendar event pills (day cells)
│   └── loan-confirmation/page.tsx — Book Loan Confirmation
│       └── BookLoanConfirmationPanel (new organism)
│           └── Button "Open Confirmation Modal" (existing atom)
│               └── VerificationModal (new organism)
│                   ├── OTPInput (new atom)
│                   │   └── 6× masked digit slots
│                   ├── BorrowerInfoPanel (new molecule)
│                   │   ├── Badge — eligibility status (existing atom)
│                   │   └── Book list items
│                   ├── Button "Cancel" (existing atom)
│                   └── Button "Confirm Loan" (existing atom)
└── Footer (existing organism)
```

## Component Props Contracts

### OTPInput (Atom)

```
Props:
  value: string              — current 6-digit value
  onChange: (value: string) => void
  onComplete: (value: string) => void   — fired when all 6 digits entered
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean

State (internal):
  digitValues: string[6]     — individual digit characters
  activeIndex: number        — currently focused slot index (0-5)

Behaviors:
  - Auto-focus first slot on mount (if autoFocus)
  - Mask character as "*" (or "•") after 500ms per slot
  - Auto-advance to next slot after digit entry
  - Backspace navigates to previous slot and clears current
  - Paste support (accepts exactly 6 digits)
  - Error state: red border on all slots
  - Disabled state: grayed out, no interaction
```

### VerificationModal (Organism)

```
Props:
  isOpen: boolean
  onClose: () => void
  onConfirm: (borrowerData: BorrowerInfo) => void

State:
  phase: 'input' | 'loading' | 'data' | 'error'
  pinValue: string
  borrowerData: BorrowerInfo | null
  booksData: BookInfo[]
  errorMessage: string | null

Lifecycle:
  open → input phase → [enter PIN] → loading phase → [on success] → data phase → [confirm] → close + toast
                                                      → [on error] → error phase → [back] → input phase
  open → [Esc] → close
  data phase → [Esc] → close (without confirming)
  data phase → [Cancel] → close
  data phase → [F8/Ctrl+Enter] → confirm → close + toast
```

### LibrarianDashboardSidebar (Organism)

```
Props:
  activeTab: 'calendar' | 'loan-confirmation'
  onTabChange: (tab: string) => void

Nav Items:
  1. Calendar View (icon: calendar-grid icon)
     - path: /dashboard/librarian
     - exact match for highlighting
  2. Book Loan Confirmation (icon: clipboard-check icon)
     - path: /dashboard/librarian/loan-confirmation
  3. Placeholder: Inventory Management (coming soon)
     - non-functional, shows "Coming Soon" tooltip or disabled state
  4. Placeholder: Analytics (coming soon)
     - non-functional, shows "Coming Soon" tooltip or disabled state
```

### BookLoanConfirmationPanel (Organism)

```
Props: none (self-contained page component)

State:
  modalOpen: boolean

Behaviors:
  - Renders a workspace with descriptive text about the PIN verification flow
  - "Open Confirmation Modal" button triggers modal open
  - Each loan confirmation cycle: open → verify → confirm → close → reset for next
```

### BorrowerInfoPanel (Molecule)

```
Props:
  borrower: BorrowerInfo
  books: BookInfo[]
  isLoading?: boolean        — shows skeleton placeholder when true

Data Shapes:
  BorrowerInfo:
    fullName: string
    libraryId: string
    department: string
    eligibility: 'eligible' | 'suspended'

  BookInfo:
    title: string
    author: string
    bookCode: string
    coverUrl: string | null
```

### CalendarView (Molecule)

```
Props:
  events?: CalendarEvent[]

Data Shapes:
  CalendarEvent:
    date: string          — ISO date string (YYYY-MM-DD)
    type: 'pickup' | 'overdue' | 'library_event'
    title: string
```

## UI State Shape

### Verification Modal State Machine

```
              ┌──────────────────────────────────────┐
              │                                      │
              v                                      │
  [CLOSED] ──→ [INPUT] ──enter PIN──→ [LOADING] ────┤
      ^                              │               │
      │                              │               │
      │                         [success]       [error]
      │                              │               │
      │                              v               │
      │                         [DATA] ←── retry ────┘
      │                              │
      │                         [confirm / F8]
      │                              │
      └────────── [CLOSED] ←─────────┘
           (toast shown)
```

Transitions:
- CLOSED → INPUT: `onOpen` (modal trigger clicked)
- INPUT → LOADING: `onSubmit` (6 digits entered + Enter clicked)
- LOADING → DATA: `onValidationSuccess` (PIN valid)
- LOADING → INPUT: `onValidationError` (PIN invalid, with error message)
- DATA → CLOSED: `onConfirm` (loan confirmed) + toast shown
- DATA → CLOSED: `onCancel` / Esc (loan cancelled)
- INPUT → CLOSED: Esc (modal dismissed without action)

## i18n Key Structure

Namespace `librarian.*`:
- `librarian.sidebar.calendar` — "Calendar View"
- `librarian.sidebar.loan_confirmation` — "Book Loan Confirmation"
- `librarian.sidebar.inventory_placeholder` — "Inventory Management (Coming Soon)"
- `librarian.sidebar.analytics_placeholder` — "Analytics (Coming Soon)"
- `librarian.dashboard_title` — "Librarian Dashboard" / "Librarian"

Namespace `verification.*`:
- `verification.modal_title` — "Confirm Book Loan" / "Xác nhận mượn sách"
- `verification.pin_label` — "Enter PIN provided by user:"
- `verification.search_button` — "Search / Verify"
- `verification.cancel_button` — "Cancel"
- `verification.confirm_button` — "Confirm Loan"
- `verification.borrower_section` — "Borrower Profile"
- `verification.books_section` — "Registered Books"
- `verification.eligibility_eligible` — "Eligible"
- `verification.eligibility_suspended` — "Overdue Violations / Suspended"
- `verification.error_invalid_pin` — "Invalid or expired verification PIN code."
- `verification.toast_success` — "Successfully confirmed book loan order for borrower: {name}"
- `verification.placeholder_empty` — "Click 'Open Confirmation Modal' to start verifying a book loan."
- `verification.phase_input_title` — "Enter PIN"
- `verification.phase_data_header` — "Loan Order Details"
- `verification.skeleton_loading` — "Loading borrower information..."
- `verification.shortcut_esc` — "Esc: Close"
- `verification.shortcut_enter` — "Enter: Verify PIN"
- `verification.shortcut_confirm` — "F8: Confirm Loan"
