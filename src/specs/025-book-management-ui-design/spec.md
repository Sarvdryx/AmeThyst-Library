# Feature Specification: Book Management UI Design

**Feature Branch**: `025-book-management-ui-design`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "create UI design specification base on .specify/template/design_books txt, remember to break down into many components"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Manage Book Inventory (Priority: P1)

A librarian wants to view the full book inventory in a sortable, searchable table to quickly find books by title, author, or ISBN and perform management actions like editing or deleting entries.

**Why this priority**: Core inventory management is the primary function of the dashboard; without it, librarians cannot maintain the collection.

**Independent Test**: Can be fully tested by loading the Book Management tab and verifying that the search bar filters results, the category dropdown narrows results, the table displays book data across all defined columns, and edit/delete action buttons are present for each row.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Book Management tab, **When** they type a search term in the search bar, **Then** the book table filters to show only matching titles, authors, or ISBNs.
2. **Given** the librarian selects a category from the dropdown, **When** the filter is applied, **Then** the table updates to show only books in that category.
3. **Given** the book table is displayed, **When** a row is rendered, **Then** it shows: cover thumbnail, title, author, ISBN, category, availability count, active/inactive status, and edit/delete action buttons.
4. **Given** the librarian clicks the edit button on a book row, **When** the action is triggered, **Then** an edit form or modal appears for that book.
5. **Given** the librarian clicks the delete button on a book row, **When** the action is confirmed, **Then** the book is removed from the inventory.
6. **Given** the librarian clicks "Add Book", **When** the action is triggered, **Then** a form appears to input new book details.
7. **Given** there are more than 10 books, **When** the table renders, **Then** pagination controls (page numbers, prev/next arrows) appear at the bottom showing "Page X of Y".

---

### User Story 2 - Manage Book Pickups (Priority: P1)

A librarian needs to monitor and manage pending book pickups, seeing which books are ready for pickup, which students they belong to, and how much time remains before the pickup PIN expires.

**Why this priority**: Efficient pickup management directly impacts student experience and ensures books are distributed promptly.

**Independent Test**: Can be fully tested by switching to the Book Pickup tab and verifying KPI cards display accurate counts, the pickup table shows student/book details with PIN and expiry information, and action buttons are available for each row.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Book Pickup tab, **When** the view loads, **Then** three KPI stat cards display: Pending Pickups (with count and weekly trend), Expired Today (with count), and Redeemed Today (with count and progress bar).
2. **Given** the pickup table is displayed, **When** a row is rendered, **Then** it shows: book thumbnail and title with ISBN, student avatar/name and ID, masked pickup PIN, remaining time before expiry, status badge (Urgent/Pending), and extend/cancel action buttons.
3. **Given** the search input is filled, **When** the librarian types a student name, ID, or book title, **Then** the table filters to show matching pickups.
4. **Given** the status or category filters are changed, **When** the filter is applied, **Then** the table updates to show filtered results.
5. **Given** a pickup is marked as "Urgent", **When** the row displays, **Then** it shows a red expiry timer and an "Urgent" status badge.
6. **Given** the librarian clicks "Advanced Filters", **When** the action is triggered, **Then** additional filtering options are revealed.

---

### User Story 3 - Process Book Returns (Priority: P2)

A librarian needs to process returned books, view active and overdue borrows, and mark items as returned to update the system.

**Why this priority**: Return processing is essential for keeping inventory accurate and assessing fines for late or damaged items.

**Independent Test**: Can be fully tested by switching to the Book Return tab and verifying the KPI row (Active Borrows, Overdue Items, Returns Today), applying date/status filters, and clicking "Mark Returned" on a row.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Book Return tab, **When** the view loads, **Then** three KPI cards display: Active Borrows count (with weekly trend), Overdue Items count (with critical indicator), and Returns Today count.
2. **Given** the return table is displayed, **When** a row is rendered, **Then** it shows: user avatar/name/ID, book title with call number, borrow date, due date, status badge (Active/Overdue), fees amount, and a "Mark Returned" action button.
3. **Given** the librarian selects a date range from the date filter, **When** the filter is applied, **Then** the table shows only borrows within that date range.
4. **Given** the librarian selects a status from the status dropdown, **When** the filter is applied, **Then** the table shows only items matching that status.
5. **Given** the librarian types in the search input, **When** the query is entered, **Then** the table filters by student name or book title.
6. **Given** the librarian clicks "Mark Returned" on an overdue item, **When** the action is triggered, **Then** the system processes the return and calculates applicable late fees.

---

### User Story 4 - Perform Return Inspection (Priority: P2)

A librarian needs to inspect returned books for damage, log condition issues, and calculate repair fees or deposit refunds before finalizing a return.

**Why this priority**: Condition inspection ensures the library maintains its collection quality and properly charges for damage, protecting library assets.

**Independent Test**: Can be fully tested by navigating to the Inspection tab and verifying condition checkboxes, notes textarea, borrower info card, and financial summary are all present and interactive.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Inspection tab, **When** the view loads, **Then** they see the book title "Book Return Inspection" and a two-column layout.
2. **Given** the left column displays condition options, **When** the librarian selects a condition (e.g., "Slight Cover Scratches"), **Then** the checkbox fills and the associated fee amount is shown.
3. **Given** the librarian selects multiple conditions, **When** selections change, **Then** the repair fee total in the Financial Summary updates accordingly.
4. **Given** the Inspection Notes textarea, **When** the librarian types observations, **Then** the text is recorded for the return record.
5. **Given** the right column displays Borrower Information, **When** the view loads, **Then** it shows: borrower name, book thumbnail and title, ISBN, borrow/return dates, and loan duration.
6. **Given** the Financial Summary card, **When** condition and late fees are calculated, **Then** it displays: repair fee, late return penalty, and final refund amount.

---

### User Story 5 - Tab Navigation Across Dashboard Modules (Priority: P3)

A librarian wants to switch between all four management modules (Book Management, Book Pickup, Book Return, Inspection) using a persistent top tab bar to quickly access different functions.

**Why this priority**: Tab navigation provides the structural backbone for the entire dashboard, enabling efficient workflow switching.

**Independent Test**: Can be fully tested by clicking each tab in the navigation bar and verifying that the corresponding content panel renders correctly with no cross-talk between tabs.

**Acceptance Scenarios**:

1. **Given** the tab navigation bar is displayed, **When** the page loads, **Then** four tabs are visible: "Book Management", "Book Pickup", "Book Return", and "Inspection".
2. **Given** a tab is not selected, **When** the user hovers over it, **Then** a visual hover state is shown.
3. **Given** the user clicks a different tab, **When** the tab is activated, **Then** the previously active tab content is hidden and the new tab content is displayed with a smooth transition.
4. **Given** the user is on any tab, **When** they refresh the page, **Then** the active tab resets to the default (Book Management).

### Edge Cases

- What happens when the search query returns zero results in any table? The table should display a friendly "No results found" message rather than an empty table.
- How does the system handle a book that is both pending pickup and has an expired PIN? The status should reflect the most critical state (expired) with appropriate visual indicators.
- What happens when there are zero items in any KPI stat card? The card should display "0" with a neutral progress bar (0%).
- How does the table behave when filtering across multiple criteria simultaneously? Filters should stack (AND logic) to narrow results progressively.
- What happens during the inspection if no conditions are selected? The repair fee defaults to $0.00 and the system should still allow the return to proceed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a persistent tab navigation bar with four tabs: Book Management, Book Pickup, Book Return, and Inspection.
- **FR-002**: Each tab MUST display its own dedicated content panel when selected, hiding all other panels.
- **FR-003**: The Book Management tab MUST include a search bar that filters books by title, author, or ISBN.
- **FR-004**: The Book Management tab MUST include a category dropdown to filter books by category.
- **FR-005**: The Book Management tab MUST include an "Add Book" action button that opens a book creation flow.
- **FR-006**: The Book Management tab MUST display a book inventory table with columns: Cover, Title, Author, ISBN, Category, Availability, Status, and Actions (edit/delete).
- **FR-007**: The Book Management table MUST include pagination controls when the result set exceeds a single page.
- **FR-008**: Each book row MUST show action buttons for editing and deleting the book entry.
- **FR-009**: The Book Pickup tab MUST display three KPI stat cards: Pending Pickups, Expired Today, and Redeemed Today, each with count, trend indicator, and progress bar.
- **FR-010**: The Book Pickup tab MUST provide a search input that filters pickups by student name, student ID, or book title.
- **FR-011**: The Book Pickup tab MUST provide status and category dropdown filters.
- **FR-012**: The Book Pickup tab MUST include an "Advanced Filters" toggle button.
- **FR-013**: The Book Pickup tab MUST display a pickup table with columns: Book Details, Student, Pickup PIN, Expires In, Status, and Actions (extend/cancel).
- **FR-014**: Each pickup row MUST show a status badge indicating Urgent or Pending state with appropriate color coding.
- **FR-015**: Rows with expiring pickups MUST display a countdown timer and visual urgency indicator.
- **FR-016**: The Book Return tab MUST display three KPI stat cards: Active Borrows, Overdue Items, and Returns Today.
- **FR-017**: The Book Return tab MUST provide status, date range, and search filters.
- **FR-018**: The Book Return tab MUST display a return table with columns: User, Book Title, Borrow Date, Due Date, Status, Fees, and Actions ("Mark Returned").
- **FR-019**: The Book Return tab MUST show overdue items with distinct visual styling (red highlights, fee amounts).
- **FR-020**: Each return row MUST include a "Mark Returned" action button.
- **FR-021**: The Inspection tab MUST provide a two-column layout with condition verification on the left and borrower info/financial summary on the right.
- **FR-022**: The condition verification section MUST display selectable condition options (Perfect Condition, Slight Cover Scratches, Folded Pages, Pencil Marks, Torn Pages, Water Damage) each with an associated fee.
- **FR-023**: The condition verification MUST allow multiple conditions to be selected simultaneously and update the repair fee total in real-time.
- **FR-024**: The condition verification MUST include an "Inspection Notes" textarea for free-form observations.
- **FR-025**: The Inspection right column MUST display a Borrower Information card showing: borrower name, book thumbnail/title, ISBN, borrow/return dates, and loan duration.
- **FR-026**: The Inspection right column MUST display a Financial Summary card showing: repair fee, late return penalty, and final refund amount.
- **FR-027**: All tables across all tabs MUST include pagination controls when results span multiple pages.
- **FR-028**: All tables MUST display a "no results" state when filters return zero matches.
- **FR-029**: All KPI cards MUST include a visual progress bar indicating completion or capacity.
- **FR-030**: All KPI cards MUST show a trend indicator (e.g., percentage change vs. prior period) with color coding for positive or negative trends.

### Key Entities

- **Book**: A library resource. Identified by title, author, ISBN, category, availability count, and status.
- **Pickup**: A pending book reservation ready for student collection. Associated with a book, a student, a unique pickup PIN, and an expiry time. Status can be Pending, Urgent, or Expired.
- **Borrow**: A checked-out book awaiting return. Associated with a user, a book, borrow date, due date, status (Active/Overdue), and any accumulated fees.
- **Return**: A completed return transaction. Includes inspection conditions, notes, calculated fees, and final refund amount.
- **Student/User**: A library patron. Identified by name, ID, and avatar.
- **Condition**: A damage category for inspection. Each condition has a name, checkbox state, and associated fee amount.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four tab modules (Book Management, Book Pickup, Book Return, Inspection) render within the dashboard with zero visual overlap or content mixing between tabs.
- **SC-002**: Each table displays data across all specified columns and supports basic search/filter operations that return filtered results in under 2 seconds.
- **SC-003**: KPI stat cards display correctly with counts, trend indicators, and progress bars for all three tab views that use them.
- **SC-004**: Pagination controls function correctly, allowing navigation between pages with accurate "Page X of Y" or "Showing 1-N of M results" indicators.
- **SC-005**: All interactive elements (buttons, dropdowns, checkboxes, search inputs, textareas) show appropriate visual states (default, hover, active, focus, disabled).
- **SC-006**: The inspection condition selection correctly tracks multiple selections, updates the repair fee total in real-time, and reflects changes in the financial summary.
- **SC-007**: Users can complete an end-to-end return workflow (find overdue item, click "Mark Returned", inspect conditions, add notes, view financial summary) without encountering dead ends or missing UI elements.

## Assumptions

- **Mock Data**: All book, student, pickup, and borrow data will use realistic mock data for initial UI development and testing, with no backend integration required at the UI specification stage.
- **Atomic Design**: All UI components will be broken down into Atoms, Molecules, Organisms, and Templates/Pages following the Atomic Design methodology mandated by the project constitution.
- **Responsive Scope**: The initial specification focuses on desktop dashboard layout; responsive behavior for mobile/tablet is assumed for all components but not explicitly specified in acceptance scenarios.
- **Static UI**: Complex state management, real-time countdown timers (for pickup expiry), and API integration are out of scope for this UI specification and will be addressed in future iterations.
- **Navigation State**: The active tab resets to "Book Management" on page load; persistent tab state across sessions is not required for v1.
- **Visual Design Language**: The existing design system (colors, typography, spacing) from the project constitution and design tokens will be applied to all components.
