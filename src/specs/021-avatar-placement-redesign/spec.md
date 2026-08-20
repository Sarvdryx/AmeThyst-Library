# Feature Specification: Redesign Avatar Placement and Sizing

**Feature Branch**: `021-avatar-placement-redesign`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Redesign avatar placement and sizing on profile page: move AvatarUploader component into Sidebar so it lives there permanently (not in main content area); increase avatar size in Sidebar (currently too small); when avatar updates, also sync the avatar displayed in the top Navbar; the main profile content area should no longer show any avatar UI. Affected files: Sidebar.tsx (add AvatarUploader, increase avatar size), Navbar.tsx (subscribe to avatar state changes), ProfileTemplate.tsx (remove avatarUrl prop if only used for main content avatar), profile/page.tsx (ensure avatar state is lifted high enough to feed both Sidebar and Navbar)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Profile Avatar Management in Sidebar (Priority: P1)

As a logged-in user on the profile page, I want to see and manage (upload/paste URL) my profile avatar directly in the Left Sidebar so that the layout is clean and the avatar is permanently visible on the side.

**Why this priority**: It is the core requirement to move the uploader into the Sidebar and support editing directly in the Sidebar rather than the main profile page content.

**Independent Test**: Can be fully tested by going to the Profile page, hovering over the avatar in the Left Sidebar, uploading a new file or pasting an image URL, and verifying that the Sidebar avatar immediately displays the updated image.

**Acceptance Scenarios**:

1. **Given** a logged-in user is on the profile page, **When** they hover over the avatar image in the Left Sidebar, **Then** an edit icon/overlay appears on top of the avatar.
2. **Given** the edit overlay is visible, **When** the user clicks it, **Then** a menu with "Upload File" and "Paste Image URL" options is displayed.
3. **Given** the user selects "Upload File", chooses a valid image (<= 2MB), and submits, **When** the upload completes, **Then** the Sidebar avatar is updated with the new image.
4. **Given** the user selects "Paste Image URL", inputs a valid image URL, and submits, **When** the update completes, **Then** the Sidebar avatar is updated with the new image.

---

### User Story 2 - Navbar Avatar Synchronization (Priority: P2)

As a logged-in user, I want the avatar image displayed in the top Navbar to instantly update to match my new avatar when I change it, so that the user interface maintains a consistent state across different layout blocks.

**Why this priority**: Ensures visual consistency and a premium user experience across the layout without requiring manual page refreshes.

**Independent Test**: Can be fully tested by modifying the avatar via the Sidebar uploader and verifying that the avatar in the top Navbar updates to match the new image in real-time.

**Acceptance Scenarios**:

1. **Given** a logged-in user is on any page, **When** the top Navbar is rendered, **Then** it displays their custom profile avatar image instead of just initials, if one exists.
2. **Given** the user updates their avatar from the Sidebar, **When** the update completes successfully, **Then** the top Navbar's avatar image updates instantly without a page reload.

---

### User Story 3 - Main Profile Content Cleanup (Priority: P3)

As a logged-in user, I want the main profile content area to be dedicated to personal info and metadata cards without any avatar uploader UI or hover controls, so that the layout is uncluttered.

**Why this priority**: Aesthetic enhancement to organize information cleanly and avoid redundant controls.

**Independent Test**: Can be fully tested by inspecting the main profile page content area and verifying that there is no uploader input, edit button, or avatar image displayed there.

**Acceptance Scenarios**:

1. **Given** the user is viewing the Profile page, **When** they look at the main content card headers and body, **Then** no avatar image or AvatarUploader components are present in that area.

---

### Edge Cases

- **What happens when the avatar image fails to load or has an invalid/broken URL?**
  The system MUST fall back gracefully to displaying the user's initials (in both Sidebar and Navbar) and log/report the error appropriately.
- **What happens when the avatar is updated while on a page other than the main profile page (e.g., Security page)?**
  If the sidebar uploader is used on the Security page, it MUST successfully update the database, localStorage, and immediately reflect in both the Sidebar and top Navbar without breaking the layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `AvatarUploader` component MUST be moved from the main content area of the profile page and embedded directly inside the `Sidebar` component.
- **FR-002**: The avatar size inside the `Sidebar` MUST be increased from the current small size (`w-20 h-20`) to a larger size (`w-28 h-28` or similar) to ensure clear visibility.
- **FR-003**: The `ProfileTemplate` component MUST no longer render the avatar uploader inside its main content layout, but it MUST propagate the lifted avatar state and update handlers down to the `Sidebar` and `NavBar`.
- **FR-004**: The avatar state (and change handlers) MUST be lifted in `profile/page.tsx` (and `profile/security/page.tsx` where applicable) high enough to supply both the `Sidebar` and `NavBar` components.
- **FR-005**: The `NavBar` (or `AuthActions`) component MUST subscribe to avatar state updates, so that when a user's avatar changes, the Navbar displays the new avatar image instantly.
- **FR-006**: When the avatar updates, the application MUST update the user's avatar property in `localStorage` via the `updateStoredUser` utility, so the Navbar and Sidebar can retrieve the current avatar on page loads.

### Key Entities *(include if feature involves data)*

- **User**: Represents the authenticated user. Key attributes include:
  - `avatar`: The URL pointing to the user's profile image (or null/empty).
  - `username`: Used to display initials if no avatar is set.
  - `role`: User's permission level.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The avatar image in both the Sidebar and the top Navbar updates within 1.5 seconds of a successful upload/URL save.
- **SC-002**: The layout of the main profile page content contains exactly 0 uploader or avatar edit components.
- **SC-003**: The size of the avatar in the Left Sidebar is increased by at least 40% (from `80px` to `112px`).

## Assumptions

- **A-001**: The existing `AvatarUploader` component can be reused with minor configuration modifications for styling and placement.
- **A-002**: The backend API `POST /user/avatar` is fully functional and does not need schema or database-level updates.
- **A-003**: `localStorage` is used to persist user session data (including `avatar`) and is reliable across page transitions.
