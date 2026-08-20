# Feature Specification: Librarian Announcements Dashboard

**Feature Branch**: `[current-branch]`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Tôi cần thêm một trang giao diện trong dashboard là announcements của librarian. Viết code trong folder client/app/dashboard/librarian. Tham khảo và sử dụng mock data để thực hiện layout libary-dashboard-announcement-layout.txt. Đảm bảo sự đồng nhất giao diện..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Announcements List (Priority: P1)

As a librarian, I want to see a list of all announcements (active, draft, expired) so that I can manage library communications.

**Why this priority**: Viewing the list is the foundational step before editing or creating announcements.

**Independent Test**: Can be tested by verifying the list renders correctly with mock data, showing proper status badges and dates.

**Acceptance Scenarios**:

1. **Given** the librarian is on the Announcements dashboard page, **When** the page loads, **Then** a list of announcements is displayed with their respective statuses (Active, Draft, Expired), dates, and titles.
2. **Given** the announcement list is displayed, **When** the librarian clicks on an announcement, **Then** the editor panel populates with that announcement's details.

---

### User Story 2 - Create/Edit Announcement (Priority: P1)

As a librarian, I want to create new announcements or edit existing ones using an editor panel, so I can communicate important updates to library users.

**Why this priority**: Core functionality of the feature; without this, announcements cannot be managed.

**Independent Test**: Can be tested by filling out the editor form and clicking action buttons (Save Draft, Publish Now).

**Acceptance Scenarios**:

1. **Given** the librarian is using the Announcement Editor, **When** they fill in the Title, Expiry Date, Content Body, and toggle "Pin to Homepage", **Then** the inputs correctly reflect the entered data.
2. **Given** a drafted announcement in the editor, **When** the librarian clicks "Save Draft", **Then** the announcement is saved with a "Draft" status (in mock state).
3. **Given** a valid announcement in the editor, **When** the librarian clicks "Publish Now", **Then** the announcement is saved with an "Active" status (in mock state).

### Edge Cases

- What happens when an announcement title or body is extremely long? (Should truncate with ellipsis in the list, and wrap normally in the editor).
- How does the system handle an expiry date set in the past during creation? (Should show a validation warning or prevent submission).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a list of all announcements categorized by status (Active, Draft, Expired).
- **FR-002**: The system MUST provide an Announcement Editor panel next to the list.
- **FR-003**: The editor MUST include fields for Announcement Title, Expiry Date, Pin to Homepage (toggle), and Content Body.
- **FR-004**: The system MUST allow the librarian to "Save Draft" or "Publish Now".
- **FR-005**: The UI MUST use mock data for initial implementation, but be structured to allow easy integration with a backend API later.
- **FR-006**: The UI MUST strictly follow the project's existing design system, including responsive layout, dark mode support, and localization (i18n).

### Key Entities *(include if feature involves data)*

- **Announcement**:
  - `id`: Unique identifier
  - `title`: String
  - `status`: Enum (ACTIVE, DRAFT, EXPIRED)
  - `date`: Date (creation or publish date)
  - `expiryDate`: Date
  - `content`: String (body text)
  - `isPinned`: Boolean (Pinned to Homepage)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The UI layout correctly implements the two-panel design (List + Editor) as referenced in the mockup, achieving 100% visual consistency with the existing dashboard theme.
- **SC-002**: Users can interact with the mock data (e.g., clicking an item populates the editor) with zero UI blocking errors.
- **SC-003**: All text elements are fully localized using the `en.json` and `vi.json` dictionaries.
- **SC-004**: The page supports light/dark mode switching without visual glitches or hardcoded hex colors that violate the theme.

## Assumptions

- The feature will initially rely on mock data provided within the component or a dedicated mock file.
- The existing Librarian Dashboard Layout (`LibrarianDashboardLayout`) will wrap this new page.
- Localization strings for statuses (Active, Draft, Expired) and editor labels will be added to the global translation dictionaries.
