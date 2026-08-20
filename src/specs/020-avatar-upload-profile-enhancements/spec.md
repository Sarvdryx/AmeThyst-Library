# Feature Specification: Avatar Upload and Profile Page Enhancements

**Feature Branch**: `020-avatar-upload-profile-enhancements`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Avatar upload and profile page enhancements: display role badge and borrow_num read-only on profile page; avatar supports two flows: file upload to Cloudinary or paste URL directly, both save to existing avatar column in DB; no bio, no department changes. Server: install cloudinary+multer, create cloudinary config, multer middleware (memoryStorage 2MB image/*), uploadAvatar controller handling both multipart and JSON content types, POST /user/avatar route with verifyToken. Client: AvatarUploader component with circular image fallback icon hover overlay upload/paste flows, wire into Sidebar and ProfileTemplate via avatarUrl prop, update profile page state with avatarUrl+role+borrowNum from GET /user/profile, add two read-only ProfileCards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Flexible Avatar Update (Priority: P1)

As a library user, I want to view my avatar on my profile page and sidebar, and be able to update it by either uploading an image file or pasting a direct image link, so that my profile is customized.

**Why this priority**: Profile personalization is a key user engagement feature, and the sidebar avatar provides visual feedback of the active session.

**Independent Test**: Can be tested by navigating to the profile page, verifying the default placeholder displays, uploading a valid JPEG/PNG file, and seeing both the profile page and sidebar avatars update immediately. Can also be tested by pasting a valid image URL and verifying the same visual update.

**Acceptance Scenarios**:

1. **Given** a user is logged in with no custom avatar set, **When** they view their profile page or the sidebar, **Then** they see a circular placeholder icon displaying their initials or a default user icon.
2. **Given** a user is on the profile page, **When** they hover over their circular avatar, **Then** an edit overlay is displayed.
3. **Given** a user clicks the avatar edit overlay, **When** they select and upload a valid image file under 2MB, **Then** the file is uploaded to Cloudinary, stored in the user's avatar database field, and the avatar image updates on both the profile page and the sidebar.
4. **Given** a user clicks the avatar edit overlay, **When** they paste a valid image URL and save, **Then** the URL is validated, stored in the user's avatar database field, and the avatar image updates on both the profile page and the sidebar.

---

### User Story 2 - Read-Only Account Status Display (Priority: P2)

As a library user, I want to view my role and the number of books I have currently borrowed on my profile page, so that I can easily track my account details.

**Why this priority**: Users need clear visibility of their borrowing metrics and system role, but these details must be read-only to prevent unauthorized privilege escalation or manipulation of lending statistics.

**Independent Test**: Can be tested by loading the profile page as a user with a specific role (e.g., "Reader") and a specific number of active loans (e.g., "3 books"), and verifying that these values are displayed in read-only visual cards.

**Acceptance Scenarios**:

1. **Given** a user is on the profile page, **When** the profile data loads, **Then** they see a read-only role badge (e.g., "Reader", "Admin") next to or below their name.
2. **Given** a user is on the profile page, **When** the profile data loads, **Then** they see a read-only profile card showing their current count of borrowed books (`borrow_num`).
3. **Given** a user is on the profile page, **When** they look at the role badge or the borrow count card, **Then** there are no inputs or buttons that allow them to edit or change these values.

---

### User Story 3 - Avatar Upload Validation and Error Handling (Priority: P3)

As a library user, I want the system to validate my avatar upload files and pasted URLs, so that I receive immediate, helpful feedback if I make a mistake, and the application remains stable.

**Why this priority**: Input validation protects the application backend from malicious uploads, reduces hosting bandwidth waste, and ensures user actions fail gracefully.

**Independent Test**: Can be tested by attempting to upload a 3MB file or a text file, and verifying that an error message is displayed on the screen and no API request is sent. Can also be tested by simulating a network failure during save and verifying that the page shows an error banner without losing current page state.

**Acceptance Scenarios**:

1. **Given** a user is uploading an avatar file, **When** they select a file larger than 2MB, **Then** the upload is blocked, and a localized error message is displayed.
2. **Given** a user is uploading an avatar file, **When** they select a file with a non-image MIME type (e.g. text/plain, application/pdf), **Then** the upload is blocked, and a localized error message is displayed.
3. **Given** a user is pasting an avatar URL, **When** they submit an invalid URL format, **Then** the submission is blocked, and a localized validation error is displayed.
4. **Given** a server-side upload failure occurs, **When** the user attempts to update their avatar, **Then** the system displays a localized error banner and retains the user's previous avatar image.

### Edge Cases

- **Cloudinary API Rate Limits or Failures**: If the Cloudinary service fails or is unreachable during file upload, the backend must catch the error, log it, return a user-friendly error response (500 status), and the frontend must display a generic "upload failed" toast/message without disrupting other profile page states.
- **Pasted URL Broken/Unreachable**: If a user submits a URL that does not resolve or points to an invalid image, the frontend avatar component should detect the image load failure using the `onError` event handler and display the fallback initials/placeholder icon.
- **Concurrent Profile Updates**: If the user updates their avatar while also having other profile forms open, the avatar update must succeed and refresh the local profile state independently without resetting other unsaved fields (e.g. name, email).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST fetch the user's avatar URL (`avatarUrl`), role (`role`), and borrowed book count (`borrowNum`) from the backend via the authenticated `GET /user/profile` endpoint.
- **FR-002**: The system MUST support two distinct user flows for updating the avatar:
  - **Upload Flow**: Selecting an image file from the user's local device.
  - **Paste Flow**: Pasting a direct HTTP/HTTPS image URL.
- **FR-003**: The backend MUST handle file uploads using `multer` middleware configured with `memoryStorage` and restrict files to `image/*` MIME types with a maximum file size of 2MB.
- **FR-004**: The backend MUST upload files from the upload flow to Cloudinary and store the returned secure URL in the existing `avatar` database column of the user table.
- **FR-005**: The backend MUST accept direct image URLs from the paste flow and store the URL string directly in the existing `avatar` database column.
- **FR-006**: The backend MUST expose a `POST /user/avatar` endpoint that is protected by token verification (`verifyToken`) and handles both multipart/form-data (for file uploads) and application/json (for URL paste).
- **FR-007**: The client MUST display the avatar in the sidebar and profile page using a circular visual shape with a hover overlay containing edit triggers.
- **FR-008**: The client MUST display the user's role as a styled, read-only badge.
- **FR-009**: The client MUST display the user's `borrow_num` in a read-only card.
- **FR-010**: The user profile page MUST NOT contain input fields, edit options, or submit actions for biography (`bio`) or department (`department`).
- **FR-011**: All new and modified user-facing text strings, placeholders, and error messages MUST be localized using English (`en.json`) and Vietnamese (`vi.json`) dictionaries.
- **FR-012**: All new and modified components MUST support the global light/dark theme system using design tokens or Tailwind CSS dark mode utilities.

### Key Entities *(include if feature involves data)*

- **User**: Represents the authenticated member. Relevant attributes for this feature are:
  - `avatar`: URL string referencing the user's active avatar image (can be a Cloudinary URL or an external web URL).
  - `role`: String representing the security role (e.g., 'Reader', 'Admin'). Read-only.
  - `borrow_num`: Integer representing the number of active book loans. Read-only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload a new avatar and see the updated image reflect in both the profile header and the sidebar within 5 seconds under standard network conditions (latency <100ms, upload speed >5Mbps).
- **SC-002**: Pasting a valid image URL updates the profile page and sidebar avatars within 3 seconds.
- **SC-003**: 100% of uploaded files exceeding 2MB or containing non-image MIME types are successfully intercepted and blocked by the frontend/backend validation before being processed.
- **SC-004**: Toggling the application language immediately translates all avatar upload controls, read-only badges, and error messages between English and Vietnamese.
- **SC-005**: All UI changes are fully responsive and adjust correctly to mobile (<768px), tablet (768px - 1024px), and desktop (>1024px) screen sizes without horizontal scrolling or layout overlaps.

## Assumptions

- Cloudinary configuration keys (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) will be supplied via backend environment variables in `.env`.
- The database table already possesses an `avatar` column of type text, as well as `role` and `borrow_num` columns.
- The `GET /user/profile` endpoint returns the current values of `avatar`, `role`, and `borrow_num`.
- Next.js environment configuration `.env.local` provides `NEXT_PUBLIC_API_URL` referencing the backend base address.
