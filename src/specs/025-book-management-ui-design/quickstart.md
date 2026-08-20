# Quickstart: Book Management Dashboard

## Prerequisites

- Node.js 20+ installed
- Project dependencies installed: `cd src/client && npm install`
- Dev server running: `cd src/client && npm run dev`
- Browser opens at `http://localhost:3000`

## Setup

1. Ensure the project is on the `025-book-management-ui-design` branch (or feature directory is `specs/025-book-management-ui-design`)
2. Locate the mock data file at `src/client/app/data/mockLibraryData.ts` (to be created during implementation)

## Validation Scenarios

### Scenario 1: Tab Navigation

**Command**: Navigate to `/dashboard/librarian` in a browser

**Expected outcome**:
- Librarian Dashboard Sidebar is visible on the left with "Books" link highlighted
- Tab navigation bar displays 4 tabs: "Book Management", "Book Pickup", "Book Return", "Inspection"
- "Book Management" tab is active by default with a bottom border indicator
- Clicking each tab switches the content panel smoothly
- Active tab indicator moves to the clicked tab

**To verify**: `See all 4 tabs render and switch correctly`

---

### Scenario 2: Book Inventory Table

**Command**: On the Book Management tab

**Expected outcome**:
- Search bar with search icon at the top
- Category dropdown showing "All Categories" default
- "Add Book" button on the right
- Table with 8 columns: Cover, Title, Author, ISBN, Category, Availability, Status, Actions
- Multiple book rows with cover images, text data, availability badges, status dots
- Edit (pencil) and Delete (trash) icon buttons in the Actions column
- Pagination at bottom showing "Page 1 of N"
- Page number buttons with prev/next arrows

**To verify**: `All table elements render with mock data`

---

### Scenario 3: Book Pickup with KPI

**Command**: Click "Book Pickup" tab

**Expected outcome**:
- 3 KPI stat cards: Pending Pickups (with count, trend "+12%", progress bar), Expired Today (red variant, count, progress), Redeemed Today (green variant, count, progress)
- Filter/search row with: search input, "All Status" dropdown, "Category: All" dropdown, "Advanced Filters" button
- Pickup table with columns: Book Details (cover + title + ISBN), Student (avatar + name + ID), Pickup PIN (masked), Expires In (countdown timer), Status (badge), Actions (extend + cancel buttons)
- Pagination at bottom

**To verify**: `KPI cards and pickup table render correctly`

---

### Scenario 4: Book Return with Filters

**Command**: Click "Book Return" tab

**Expected outcome**:
- 3 KPI cards: Active Borrows, Overdue Items (red/critical), Returns Today
- Filter row with: Status dropdown, Date range filter (calendar icon + date text), Search input
- Return table with columns: User (avatar + name + ID), Book Title (title + call number), Borrow Date, Due Date, Status (badge), Fees (amount), Actions ("Mark Returned" button)
- Overdue items highlighted with red styling
- Pagination at bottom

**To verify**: `Return table, filters, and KPI cards display correctly`

---

### Scenario 5: Return Inspection

**Command**: Click "Inspection" tab

**Expected outcome**:
- Page title "Book Return Inspection"
- Two-column layout:
  - Left: "Verify Book Condition" section with 6 selectable condition options (Perfect Condition $0, Slight Cover Scratches $2, Folded Pages $3, Pencil Marks $5, Torn Pages $15, Water Damage $20), plus "Inspection Notes" textarea
  - Right: "Borrower Information" card (name, book cover, title, ISBN, dates, duration) + "Financial Summary" card (repair fee, late penalty, final refund)
- Selecting multiple conditions updates the repair fee in Financial Summary in real-time

**To verify**: `Inspection panel with condition selection and financial summary renders`

---

### Scenario 6: Dark Mode Toggle

**Command**: Click the theme toggle in the navigation bar

**Expected outcome**:
- All dashboard elements switch to dark color scheme
- Text, backgrounds, borders, badges, tables, buttons all respect dark mode
- Theme persists across page refreshes
- Toggling back restores light mode

**To verify**: `Dark mode applies consistently to all dashboard components`

---

### Scenario 7: Locale Toggle

**Command**: Click the language toggle in the navigation bar

**Expected outcome**:
- All dashboard text (tab labels, table headers, button text, placeholder text, KPI labels, status labels) switches to Vietnamese
- Toggling back restores English
- Both `en.json` and `vi.json` contain complete key sets for the `librarian` namespace

**To verify**: `i18n applies to all dashboard text elements`

---

### Scenario 8: Empty State

**Command**: Type a search query that matches no records in any tab

**Expected outcome**:
- Table area shows "No books found" (or appropriate empty state) message
- "Clear All Filters" button is visible
- Clicking "Clear All Filters" resets the search and shows all records

**To verify**: `Empty state renders with clear filters action`

---

## Development Commands

```bash
# Start dev server
cd src/client && npm run dev

# Run lint
cd src/client && npm run lint

# Run type check (if TypeScript configured)
cd src/client && npx tsc --noEmit

# Build for production
cd src/client && npm run build
```

## File Reference

| File | Purpose |
|------|---------|
| `src/client/app/dashboard/librarian/page.tsx` | Dashboard page entry point (existing, update to use new dashboard) |
| `src/client/app/components/organisms/LibrarianBookDashboard.tsx` | Main dashboard template (NEW) |
| `src/client/app/components/organisms/BookManagementTab.tsx` | Tab 1 organism (NEW) |
| `src/client/app/components/organisms/BookPickupTab.tsx` | Tab 2 organism (NEW) |
| `src/client/app/components/organisms/BookReturnTab.tsx` | Tab 3 organism (NEW) |
| `src/client/app/components/organisms/InspectionTab.tsx` | Tab 4 organism (NEW) |
| `src/client/app/components/molecules/KPIStatCard.tsx` | KPI card molecule (NEW) |
| `src/client/app/components/molecules/PickupTableRow.tsx` | Pickup row molecule (NEW) |
| `src/client/app/components/molecules/ReturnTableRow.tsx` | Return row molecule (NEW) |
| `src/client/app/components/atoms/KPIProgressBar.tsx` | Progress bar atom (NEW) |
| `src/client/app/data/mockLibraryData.ts` | Mock data file (NEW) |
| See [contracts/ui-component-contracts.md](./contracts/ui-component-contracts.md) for all component contracts. | |
| See [data-model.md](./data-model.md) for entity definitions and validation rules. | |
