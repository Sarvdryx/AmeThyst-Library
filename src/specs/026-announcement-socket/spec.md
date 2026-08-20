# Feature Specification: Announcement Notification Bell, is_pinned Removal & Reading View

**Feature Branch**: `announcement-backend`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Remove is_pinned from database and UI, add a notification bell dropdown on the navigation bar, and implement a full announcement reading view overlay."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Decouple from Pin to Homepage (Part 1 - Priority: P1)

As a librarian, I want the system to be decoupled from the "Pin to Homepage" feature so that layout and database structure are simplified.

**Why this priority**: Cleaning up the database schema and decoupling pinning logic ensures that subsequent UI updates are built on a solid database state without carrying legacy fields.

**Independent Test**: Creating or editing an announcement from the librarian dashboard no longer sends or displays any pin-related field, and existing announcements load correctly.

**Acceptance Scenarios**:
1. **Given** a librarian is authenticated, **When** they view the announcement list or the creation form, **Then** no "Pin to Homepage" option is displayed.
2. **Given** a librarian is authenticated, **When** they create/edit an announcement, **Then** the request payload contains no pinning field, and database columns are fully decoupled.

---

### User Story 2 - Notification Bell Dropdown (Part 2 - Priority: P1)

As a library user, I want to access a dropdown panel listing active announcements by clicking the bell icon on the NavBar, so I can stay up to date without moving to a different page.

**Why this priority**: Essential to let users discover new announcements in a modern, non-intrusive way directly from the header navigation.

**Independent Test**: Clicking the bell while logged in fetches active announcements from `/api/announcements` and displays them in a panel, and clicking outside closes the dropdown correctly.

**Acceptance Scenarios**:
1. **Given** a user is logged in, **When** they look at the NavBar, **Then** they see a notification bell icon with an orange unread dot indicator if new announcements are active.
2. **Given** the user clicks the notification bell, **When** the dropdown opens, **Then** they see the list of active announcements showing the title, formatted date, and a line-clamped content preview, and the orange dot disappears.
3. **Given** the dropdown panel is open, **When** the user clicks anywhere outside of the panel, **Then** the panel closes.

---

### User Story 3 - Full Announcement Reading View (Part 3 - Priority: P1)

As a library user, I want to read the full details of an announcement in a clean, article-style overlay centered on the page when I click on it inside the bell dropdown, so that I can consume the entire announcement content without full page reloads or routing changes.

**Why this priority**: Extends the notification bell user experience by allowing full reading of the announcement details without taking the user away from their current page context.

**Independent Test**: Clicking an announcement item inside the dropdown closes the dropdown, opens a centered detail modal overlay styled like an article, preserves line breaks inside the body, and closes cleanly when clicking the close button or clicking the background backdrop.

**Acceptance Scenarios**:
1. **Given** the notification bell dropdown is open, **When** the user clicks on a specific announcement item, **Then** the dropdown panel closes and a centered reading view modal opens on top of the current page.
2. **Given** the reading view modal is open, **When** the user views it, **Then** they see:
   - A large headline showing the announcement title.
   - A byline/meta row showing the publish date (createdAt) and, if present, the expiry date.
   - The body content styled with a comfortable line height (`leading-relaxed`) and a readable max-width column, preserving original line breaks.
3. **Given** the reading view modal is open, **When** the user clicks the backdrop overlay or the close [X] button, **Then** the modal closes and the user returns to their page context.

---

## Edge Cases

- **Line Break Preservation**: If an announcement body has multiple paragraphs separated by line breaks, they must not collapse into a single text block. The CSS `whitespace-pre-line` (or equivalent style) must be used.
- **Empty States**: If there are no active announcements, the dropdown panel should show a clear empty state message ("No new announcements").
- **Page Scroll Locking**: When the reading view overlay modal is open, page scrolling must be locked on the body (similar to [StudyGroupInfoModal.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms/StudyGroupInfoModal.tsx)) to prevent double scrolling.
- **Theme Matching**: The reading view must adapt to light/dark modes using the existing theme tokens, rendering a `#F8EFE6` background in light mode and a `#091426` background in dark mode.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST remove all references to `is_pinned` and `isPinned` from the database, backend controller, services, and the Librarian Announcements Dashboard.
- **FR-002**: The top navigation bar MUST display a notification bell with a persistent unread indicator dot if there are active announcements newer than the last seen announcement ID stored in the user's browser `localStorage`.
- **FR-003**: The notification bell dropdown MUST list the titles, creation dates, and text-truncated content of active announcements.
- **FR-004**: Clicking the notification bell MUST immediately dismiss the unread indicator dot and record the newest active announcement ID in `localStorage` under `amethyst:announcements:lastSeenId`.
- **FR-005**: The system MUST support a centered reading view overlay modal when an announcement is clicked in the dropdown.
- **FR-006**: Opening the reading view overlay modal MUST close the notification bell dropdown panel.
- **FR-007**: The reading view overlay modal MUST render:
  - The announcement title in a large, prominent font.
  - A metadata byline showing the publish date and optional expiration date.
  - The full announcement body content using `leading-relaxed` line height, structured paragraphs, and a readable max-width line length.
- **FR-008**: The reading view body content MUST preserve original line breaks using appropriate CSS formatting (e.g. `whitespace-pre-line` or `whitespace-pre-wrap`).
- **FR-009**: The reading view overlay modal MUST support click-outside backdrop dismissals and a dedicated close [X] button.
- **FR-010**: The reading view overlay modal MUST use LIMA theme tokens (`bg-background` and `text-foreground`) to dynamically respond to light and dark theme toggles.
- **FR-011**: The reading view overlay modal MUST lock body scrolling on mount and restore it on unmount.
- **FR-012**: No new API endpoints MUST be called for the reading view; it should reuse the active announcements dataset loaded in the notification bell hook.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clean database migration completed with `is_pinned` dropped and zero regressions on the librarian management dashboard.
- **SC-002**: The unread indicator dot is shown only when there is a new active announcement that has not yet been viewed (bell click).
- **SC-003**: The reading view modal opens in under 100ms from clicking an item in the dropdown.
- **SC-004**: The reading view displays comfortable typography matching the rest of the application's book details page.
- **SC-005**: Light and dark modes render correctly with 100% color contrast adherence to LIMA tokens.

---

## Assumptions

- The backend public endpoint `GET /api/announcements` returns all necessary fields, including the full announcement `content`. No additional fetch call by ID is needed.
- The reading view modal is presentation-only, and does not perform read/unread tracking on a per-announcement basis in the database.
- The modal layout pattern uses standard React portals or conditional rendering within the page shell.
