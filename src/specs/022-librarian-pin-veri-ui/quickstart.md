# Quickstart: Librarian PIN Verification UI

## Prerequisites

- Node.js 18+ and npm installed
- Frontend server running on `http://localhost:3000`
- Existing backend server on `http://localhost:5000` (not required for UI mock mode but needed for real integration)
- A user account with `librarian` role in the database

## Setup

### 1. Install dependencies

```bash
cd client
npm install
```

### 2. Start the development server

```bash
cd client
npm run dev
```

The app will be available at `http://localhost:3000`.

## Validation Scenarios

### Scenario 1: Access Librarian Dashboard

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Log in with a librarian account | Redirected to dashboard |
| 1.2 | Navigate to `/dashboard/librarian` | Librarian Dashboard loads with sidebar showing "Librarian Dashboard" header |
| 1.3 | Observe sidebar | Two active tabs visible: "Calendar View" and "Book Loan Confirmation", plus placeholder items |
| 1.4 | Click "Calendar View" | Calendar grid renders with color-coded events (green = pickups, red = overdue) |
| 1.5 | Click a date with events | Quick-view side panel opens with event summaries |

**Pass condition**: All 5 steps complete successfully.

### Scenario 2: Open and Navigate Verification Modal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Click "Book Loan Confirmation" tab | Workspace with "Open Confirmation Modal" button appears |
| 2.2 | Click "Open Confirmation Modal" | Verification modal opens with title "Confirm Book Loan", 6 empty PIN slots, auto-focus on first slot |
| 2.3 | Observe PIN input | 6 discrete digit slots, first slot focused, cursor blinking |
| 2.4 | Press `Esc` key | Modal closes |
| 2.5 | Click button to reopen | Modal opens again with fresh empty PIN slots |

**Pass condition**: Modal opens/closes correctly with keyboard and mouse.

### Scenario 3: Enter PIN and View Borrower Data

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Open verification modal | PIN input phase visible |
| 3.2 | Type digits into each slot | Each digit is masked as "•", focus auto-advances to next slot |
| 3.3 | Type all 6 digits | "Search / Verify" activates, or auto-submit fires |
| 3.4 | Press `Enter` or click "Search / Verify" | Loading skeleton appears briefly |
| 3.5 | Wait for mock validation | Data overlay phase appears with two columns |
| 3.6 | Check left column | Borrower name (emphasized), library ID, department, eligibility badge displayed |
| 3.7 | Check right column | Scrollable list of registered books with thumbnails, titles, authors, book codes |

**Pass condition**: PIN entry demonstrates masking, auto-advance, and transition to data overlay.

### Scenario 4: Confirm Loan

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | In data overlay phase, press `F8` or `Ctrl+Enter` | Modal closes immediately |
| 4.2 | Observe toast | Success toast notification appears: "Successfully confirmed book loan order for borrower: [name]" |
| 4.3 | Wait for toast auto-dismiss | Toast fades out after ~4 seconds |

**Pass condition**: Loan confirmation with keyboard shortcut works, toast displays and auto-dismisses.

### Scenario 5: Cancel Transaction

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Open verification modal and enter PIN | Data overlay phase visible |
| 5.2 | Click "Cancel" button or press `Esc` | Modal closes without confirmation |
| 5.3 | Verify no toast appears | No success/error toast shown |

**Pass condition**: Cancel closes modal without side effects.

### Scenario 6: Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Open verification modal | Input phase visible |
| 6.2 | Enter an invalid PIN (e.g., `000000`) | All 6 slots show red borders |
| 6.3 | Observe error message | Inline error text: "Invalid or expired verification PIN code." appears |
| 6.4 | Clear and re-enter digits | Error state clears, slots return to normal appearance |

**Pass condition**: Error state is clearly communicated and recoverable.

### Scenario 7: Keyboard Shortcuts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 7.1 | Open modal, press `Esc` | Modal closes from any phase |
| 7.2 | Open modal, type 6 digits, press `Enter` | PIN validation triggers (transitions to data or error) |
| 7.3 | In data phase, press `F8` | Loan confirmation triggers (modal closes + toast) |
| 7.4 | In data phase, press `Ctrl+Enter` | Same as F8 (loan confirmed) |

**Pass condition**: All four shortcuts work reliably.

### Scenario 8: Calendar View Navigation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 8.1 | Navigate to Calendar View | Monthly calendar grid displayed |
| 8.2 | Click month navigation arrows | Calendar navigates to previous/next month |
| 8.3 | Toggle to weekly view (if toggle exists) | Calendar switches to week-by-week layout |
| 8.4 | Hover over color-coded event | Event details tooltip shown |

**Pass condition**: Calendar is fully interactive with navigation and event display.

## Verification Script (Manual)

```bash
# Run this checklist after all components are implemented:

echo "=== Librarian PIN Verification UI ==="
echo ""

# 1. Dashboard
echo "1. Access /dashboard/librarian"
echo "   - Sidebar shows Librarian Dashboard header"
echo "   - Two active tabs visible"
echo "   - Calendar View renders by default"
echo ""

# 2. Modal
echo "2. Switch to Book Loan Confirmation tab"
echo "   - Workspace with description text visible"
echo "   - 'Open Confirmation Modal' button visible"
echo "   - Modal opens on click"
echo ""

# 3. PIN Input
echo "3. Enter 6-digit PIN in modal"
echo "   - 6 discrete slots with masking"
echo "   - Auto-advance between slots"
echo "   - Enter triggers validation"
echo ""

# 4. Borrower Data
echo "4. After PIN validation"
echo "   - Loading skeleton shown briefly"
echo "   - Two-column layout with borrower + books"
echo "   - Badge shows eligibility"
echo ""

# 5. Confirm
echo "5. Press F8 to confirm"
echo "   - Modal closes"
echo "   - Success toast appears"
echo ""

# 6. Error
echo "6. Enter invalid PIN"
echo "   - Red borders on all slots"
echo "   - Error message displayed"
echo "   - Clear error on re-entry"
echo ""

echo "=== END ==="
```

## i18n Key Validation

Verify that all new i18n keys exist in both `en.json` and `vi.json`:

```
librarian.* namespace:
  - dashboard_title
  - sidebar.calendar
  - sidebar.loan_confirmation
  - sidebar.inventory_placeholder
  - sidebar.analytics_placeholder

verification.* namespace:
  - modal_title
  - pin_label
  - search_button
  - cancel_button
  - confirm_button
  - borrower_section
  - books_section
  - eligibility_eligible
  - eligibility_suspended
  - error_invalid_pin
  - toast_success
  - placeholder_empty
  - phase_input_title
  - phase_data_header
  - skeleton_loading
  - shortcut_esc
  - shortcut_enter
  - shortcut_confirm
```

## Theme Validation

Verify dark mode for all new components:

```bash
echo "Toggle theme to dark mode"
echo "- OTPInput slots: bg-neutral-800, border-neutral-700"
echo "- VerificationModal: bg-[#1E293B]"
echo "- LibrarianDashboardSidebar: bg-neutral-900, border-neutral-700"
echo "- All text uses dark:text-* classes"
echo "- No hardcoded color values used"
```
