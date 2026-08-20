# Feature Specification: Librarian PIN Verification UI

**Feature Branch**: `022-librarian-pin-veri-ui`

**Created**: 2026-06-29

**Updated**: 2026-06-30 (UI redesign per Figma export)

**Status**: Draft

**Input**: User description: "Librarian PIN Verification UI — a librarian dashboard with PIN-based verification workflow for confirming book loans, including book management table, calendar view and book loan confirmation modal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Librarian Dashboard with Sidebar Nav (Priority: P1)

As a librarian, I want to access the Librarian Dashboard with a navigation sidebar so that I can switch between Book Management, Room Reservations, Announcements, and PIN Verification.

**Why this priority**: This is the foundational navigation structure. Without the dashboard shell and sidebar navigation, none of the librarian workflows can be accessed.

**Independent Test**: Can be fully tested by loading the Librarian Dashboard page and verifying the sidebar header reads "LIBRARIAN", contains four nav items (Books, Rooms, Announcements, PIN Verification), and clicking each renders the corresponding view.

**Acceptance Scenarios**:

1. **Given** a librarian is logged in, **When** they navigate to the Librarian Dashboard, **Then** the sidebar header displays "LIBRARIAN".
2. **Given** the Librarian Dashboard is loaded, **When** the librarian views the sidebar, **Then** four nav items are visible: "Books", "Rooms", "Announcements", and "PIN Verification".
3. **Given** the sidebar displays the nav items, **When** the librarian clicks "Books", **Then** the book management table with sub-tabs, search bar, and Add Book button is rendered in the main content area.
4. **Given** the sidebar displays the nav items, **When** the librarian clicks "PIN Verification", **Then** the Book Loan Confirmation workspace with an "Open Confirmation Modal" trigger button is rendered.

---

### User Story 2 - Verify Book Loan via PIN Modal (Priority: P1)

As a librarian, I want to open a verification modal, enter a 6-digit PIN provided by the borrower, and see the borrower's profile and registered books so that I can confirm the borrower's identity and process the loan.

**Why this priority**: This is the core PIN verification workflow that enables physical book checkout at the library counter.

**Independent Test**: Can be fully tested by opening the Book Loan Confirmation tab, clicking "Open Confirmation Modal", entering a 6-digit PIN into the OTP-style input fields, and verifying the borrower profile and book list are displayed after validation.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Book Loan Confirmation tab, **When** they click the "Open Confirmation Modal" button, **Then** a modal titled "Confirm Book Loan" / "Xác nhận mượn sách" appears with a close [X] button and six empty PIN digit slots auto-focused.
2. **Given** the verification modal is open, **When** the librarian types a 6-digit PIN into the OTP-style input fields, **Then** each character is masked securely as it is typed and auto-advances to the next slot.
3. **Given** the librarian has entered a complete 6-digit PIN, **When** they click the "Search / Verify" button or press Enter, **Then** a loading skeleton appears briefly, followed by a dual-column layout showing the borrower's full name, library ID, department, and eligibility badge in the left column, and a scrollable list of registered books with cover thumbnails, titles, authors, and book codes in the right column.

---

### User Story 3 - Confirm Loan with Keyboard Shortcuts (Priority: P2)

As a busy librarian, I want to use keyboard shortcuts throughout the PIN verification workflow so that I can process loans quickly without reaching for the mouse.

**Why this priority**: Keyboard accelerators significantly improve operational throughput for high-volume library counters.

**Independent Test**: Can be fully tested by opening the verification modal, pressing Esc to close it, reopening it, pressing Enter after entering a PIN to validate, and pressing F8 or Ctrl+Enter to confirm the loan.

**Acceptance Scenarios**:

1. **Given** the verification modal is open, **When** the librarian presses the Esc key, **Then** the modal closes immediately from any active sub-state.
2. **Given** the verification modal is in the PIN input phase, **When** the librarian presses Enter after completing the PIN entry, **Then** the PIN validation is triggered and transitions to the data overlay state.
3. **Given** the verification modal is in the data overlay state (post-validation), **When** the librarian presses F8 or Ctrl+Enter, **Then** the loan is confirmed, the modal closes, and a success toast notification appears.

---

### User Story 4 - Handle Invalid PIN and Error States (Priority: P2)

As a librarian, I want clear visual feedback when an invalid or expired PIN is entered so that I can inform the borrower and request a new PIN.

**Why this priority**: Error handling is essential for a reliable and user-friendly verification system.

**Independent Test**: Can be fully tested by entering an incorrect or expired PIN and verifying the input fields show red borders and an inline error message.

**Acceptance Scenarios**:

1. **Given** the verification modal is in the PIN input phase, **When** the librarian enters an invalid or expired PIN, **Then** all 6 digit input slots display red error borders accompanied by inline error text: "Invalid or expired verification PIN code."
2. **Given** the PIN validation has failed with an error state, **When** the librarian clears and re-enters a new PIN, **Then** the error state is cleared and the input fields return to their normal appearance.

---

### User Story 5 - View Calendar (Reused from User Dashboard) (Priority: P3)

As a librarian, I want to view a monthly/weekly calendar with color-coded event markers so that I can track upcoming pick-ups, overdue returns, and library events at a glance.

**Why this priority**: The calendar provides scheduling visibility but is secondary to the core loan confirmation workflow. It reuses the existing `DashboardCalendar` molecule component from the user dashboard — no new calendar component needs to be built.

**Independent Test**: Can be fully tested by switching to the Calendar View tab and verifying the existing `DashboardCalendar` component renders with a toggleable monthly/weekly display, color-coded events, and a side panel showing summaries on date click.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Calendar View tab, **When** the page loads, **Then** the existing `DashboardCalendar` component is rendered with a monthly calendar grid and toggleable weekly view option.
2. **Given** the calendar grid is displayed, **When** the librarian clicks on a date containing events, **Then** a quick-view side panel opens showing event summaries for that date.

---

### Edge Cases

- What happens when the librarian opens the modal and there are no pending reservations? The system should display an empty state or prompt the librarian to ask the borrower for a reservation code.
- What happens if the librarian enters fewer than 6 digits and presses Enter? The system should not trigger validation until all 6 digits are entered.
- What happens if the borrower's account has overdue violations? The eligibility badge should show a red/crimson "Overdue Violations / Suspended" status, and the footer should explain that the loan cannot proceed.
- What happens if the loan confirmation modal is open and another librarian action occurs (e.g., tab switch)? The modal should close, or the action should be blocked until the modal is dismissed.
- What happens when the system is loading data after PIN validation? A pulsing skeleton placeholder should be shown instead of a blank or frozen area.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Librarian Dashboard accessible to librarian users with a sidebar displaying the header "LIBRARIAN".
- **FR-002**: The dashboard sidebar MUST contain four navigation items: "Books", "Rooms", "Announcements", "PIN Verification".
- **FR-003**: The sidebar MUST use specific SVG icons for each nav item matching the Figma design: books icon, rooms/building icon, announcements/bell icon, PIN verification/key icon.
- **FR-004**: The top navigation bar (NavBar) MUST display a notification bell icon and a user avatar circle with user initials (fallback "AM") in addition to existing toggles.
- **FR-005**: The main "Books" page MUST display a heading "Books" with sub-tabs: "book management", "book pickup", "book return", "inspection".
- **FR-006**: The book management area MUST include a search bar with search icon, a category dropdown labeled "All Categories", and an "Add Book" button with plus icon.
- **FR-007**: The book management area MUST render a table with columns: Cover, Title, Author, ISBN, Category, Availability, Status, Actions.
- **FR-008**: Each table row MUST show a book cover thumbnail, title (bold), author name, ISBN in monospace font, category, availability badge (green "X / Y available" or neutral "0 / Y available"), status indicator (green dot + "Active" or gray dot + "Inactive"), and action icons (edit pencil, delete trash).
- **FR-009**: The table MUST include pagination with page number buttons, previous/next arrows, and a "Page X of Y" label.
- **FR-010**: The modal MUST display an OTP-style PIN input consisting of 6 discrete digit slots with auto-focus on the first slot upon modal open.
- **FR-011**: Each digit slot MUST mask the typed character securely as the user types.
- **FR-012**: The PIN field MUST auto-advance focus to the next slot when a digit is entered.
- **FR-013**: The modal MUST provide a "Search / Verify" text button adjacent to the PIN input to trigger manual validation.
- **FR-014**: Upon successful PIN validation, the modal MUST transition to a data overlay state showing a dual-column layout.
- **FR-015**: The left column MUST display the borrower profile: full name (emphasized), library ID number, department/faculty, and a colored eligibility badge (green for eligible, red for overdue/suspended).
- **FR-016**: The right column MUST display a scrollable list of registered book entries for the pending order, each showing a cover thumbnail placeholder, book title, author name, and unique asset ID.
- **FR-017**: The modal footer MUST contain a low-emphasis "Cancel" button (flat, gray) and a high-contrast accent "Confirm Loan" button.
- **FR-018**: The system MUST support the following keyboard shortcuts: Esc (close modal), Enter (validate PIN from input state), F8 or Ctrl+Enter (trigger confirm loan action).
- **FR-019**: Entering an invalid or expired PIN MUST display red error borders on all 6 digit slots with inline error text: "Invalid or expired verification PIN code."
- **FR-020**: During PIN validation processing, the system MUST display a pulsing skeleton placeholder in the details area rather than a blank or frozen state.
- **FR-021**: Upon successful loan confirmation, the modal MUST close and a non-blocking toast notification MUST appear stating: "Successfully confirmed book loan order for borrower: [Borrower Name]".
- **FR-022**: The system MUST allow canceling the transaction at any point via the Cancel button or Esc key, closing the modal without processing.

### Key Entities

- **Librarian**: A library staff user with access to the Librarian Dashboard. Possesses privileges to verify borrower identities via PIN and confirm book loans.
- **Borrower Profile**: A library member record. Key attributes: full name, library ID, department/faculty, account eligibility status.
- **Book Order / Reservation**: A pending reservation that is ready for physical checkout. Contains a list of books and their associated metadata (title, author, book code, thumbnail).
- **PIN**: A 6-digit verification code associated with a borrower's reservation for identity verification at the library counter.
- **Calendar Event**: A scheduling entry on the Librarian Dashboard calendar. Types: planned pickup (green), overdue return (red), library event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Librarians can complete a full loan confirmation (open modal → enter PIN → view details → confirm) in under 30 seconds.
- **SC-002**: The verification modal opens within 1 second of clicking the trigger button.
- **SC-003**: PIN validation feedback (success or error) is displayed within 2 seconds of submission.
- **SC-004**: Calendar view loads all events for the current month within 3 seconds.
- **SC-005**: Keyboard shortcuts (Esc, Enter, F8/Ctrl+Enter) respond instantly with no perceptible delay.
- **SC-006**: All error states (invalid PIN, empty state) display clear, user-friendly messages — no raw system errors exposed to the user.
- **SC-007**: The Librarian Dashboard is fully navigable using only the keyboard (tab navigation + shortcuts).
- **SC-008**: Toast notifications auto-dismiss within 5 seconds without blocking further interaction.

## Assumptions

- The existing User Dashboard layout structure will be reused as the foundation for the Librarian Dashboard.
- The existing authentication system will be extended to support a librarian user role, granting access to this dashboard.
- The PIN verification flow in this spec covers the frontend UI behavior only — backend API integration for real PIN validation and loan processing is out of scope for this phase.
- The Calendar View tab reuses the existing `DashboardCalendar` molecule component (from the user dashboard) as-is — pure UI reuse with no modification to the component itself. Event data may use mock/static data for display since no new backend integration is required.
- Calendar events will be populated from existing reservation and borrowing data in the system if available, or use static demonstration data otherwise.
- Placeholder tabs for future features (Inventory Management, Analytics) will be visually present but non-functional — clicking them may show a "Coming Soon" state.
- The feature is web-only (responsive desktop/mobile browser) with no native mobile app considerations.
- Librarian users are expected to use desktop-class devices with physical keyboards for optimal shortcut usage.
