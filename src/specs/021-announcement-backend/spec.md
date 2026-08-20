# Feature Specification: Announcement Management Backend

**Feature Branch**: `021-announcement-backend`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Build the Announcement Management backend for the LIMA library system."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Draft Announcement (Priority: P1)

As a librarian, I can create a new announcement in draft status.

**Why this priority**: This is the starting point of the announcement lifecycle. Without being able to create an announcement, no other operations make sense.

**Independent Test**: Send a POST request to `/api/announcements` with valid title, content, and optional expired_date. Verify the response has success=true, status='draft', a generated announce_id.

**Acceptance Scenarios**:

1. **Given** a librarian is authenticated, **When** they POST to `/api/announcements` with title and content, **Then** the system returns 201 with success=true and status set to 'draft'.
2. **Given** a regular user or guest is authenticated/unauthenticated, **When** they POST to `/api/announcements`, **Then** the system returns 401/403 access denied.

---

### User Story 2 - View and Filter Announcements in Management (Priority: P1)

As a librarian, I can view all announcements with pagination and status filtering in the management page.

**Why this priority**: Essential for librarians to oversee, monitor, and find announcements they want to publish or modify.

**Independent Test**: Send a GET request to `/api/announcements/manage` with optional query params like `page`, `limit`, and `status`. Verify the response contains all announcements (active, draft, expired) matching the status filter, and pagination metadata.

**Acceptance Scenarios**:

1. **Given** a librarian is authenticated, **When** they GET `/api/announcements/manage` without query params, **Then** the system returns all announcements with pagination info (default page 1, default limit 10).
2. **Given** a librarian is authenticated, **When** they GET `/api/announcements/manage?status=draft`, **Then** only draft announcements are returned.
3. **Given** a guest is authenticated, **When** they GET `/api/announcements/manage`, **Then** the system returns 401/403 access denied.

---

### User Story 3 - Publish/Unpublish Announcements (Priority: P1)

As a librarian, I can publish (draft → active) or unpublish (active → draft/expired) an announcement.

**Why this priority**: Essential to make announcements visible to users or hide them when they are no longer relevant.

**Independent Test**: Send a PATCH request to `/api/announcements/:id/status` with status update. Verify status change in DB and response.

**Acceptance Scenarios**:

1. **Given** a librarian is authenticated, **When** they PATCH `/api/announcements/:id/status` with `status: 'active'`, **Then** the system updates the status and returns the updated announcement.
2. **Given** a librarian is authenticated, **When** they PATCH `/api/announcements/:id/status` with `status: 'draft'`, **Then** the system updates the status and returns the updated announcement.

---

### User Story 4 - Edit Announcement Details (Priority: P2)

As a librarian, I can edit the title, content, and expiration date of an announcement.

**Why this priority**: Important for correcting mistakes or updating announcement details.

**Independent Test**: Send a PUT request to `/api/announcements/:id` with new title, content, or expired_date. Verify details are updated in the database.

**Acceptance Scenarios**:

1. **Given** a librarian is authenticated and an announcement exists, **When** they PUT `/api/announcements/:id` with updated title, content, or expired_date, **Then** the system updates the record and returns the updated announcement.
2. **Given** a guest, **When** they PUT `/api/announcements/:id`, **Then** the system returns 401/403 access denied.

---

### User Story 5 - Delete Announcement (Priority: P2)

As a librarian, I can delete an announcement.

**Why this priority**: Necessary to remove unwanted or incorrectly made announcements permanently.

**Independent Test**: Send a DELETE request to `/api/announcements/:id`. Verify the record is deleted from the database.

**Acceptance Scenarios**:

1. **Given** a librarian is authenticated and an announcement exists, **When** they DELETE `/api/announcements/:id`, **Then** the system deletes the record and returns 200 with success=true.
2. **Given** a guest, **When** they DELETE `/api/announcements/:id`, **Then** the system returns 401/403 access denied.

---

### User Story 6 - View Active Announcements on Homepage (Priority: P2)

As a user or guest, I can view active announcements on the homepage/dashboard.

**Why this priority**: Core value to regular readers; this displays active, non-expired announcements.

**Independent Test**: Send a GET request to `/api/announcements` (public endpoint). Verify it returns only active announcements whose expiration dates have not passed (or are NULL).

**Acceptance Scenarios**:

1. **Given** a guest, **When** they GET `/api/announcements`, **Then** the system returns 200 with list of active, non-expired announcements.
2. **Given** a guest, **When** they GET `/api/announcements`, **Then** the returned list MUST NOT contain draft or expired announcements.

---

### User Story 7 - Automatic Expiration of Announcements (Priority: P3)

As the system, announcements automatically become `expired` after their expiration date through a scheduled background task.

**Why this priority**: Automation to keep the system clean and avoid showing stale announcements without manual librarian intervention.

**Independent Test**: Run the scheduler logic or wait for the interval. Verify that announcements whose `expired_date < today` and status was `active` are automatically updated to `expired`.

**Acceptance Scenarios**:

1. **Given** an announcement has an expiration date in the past and status is `active`, **When the background scheduler runs, **Then** the status is updated to `expired`.
2. **Given** an announcement has an expiration date in the future, **When** the background scheduler runs, **Then** the status remains unchanged.

### Edge Cases

- **Empty or invalid fields**: If title or content is empty/missing, or expired_date is not a valid date format, return 400 Bad Request.
- **Expiry in the past on activation**: If expired_date is in the past, status cannot be set to 'active' (return 400 Bad Request).
- **Invalid pagination params**: If page or limit is less than 1, fall back to default values (page=1, limit=10).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support creating announcements in `draft` status (default) or immediately as `active` if specified.
- **FR-002**: The system MUST allow editing of the title, content, and expiration date of existing announcements.
- **FR-003**: The system MUST support updating an announcement's status to `active`, `draft`, or `expired`.
- **FR-004**: The system MUST support deleting announcements.
- **FR-005**: The system MUST provide a paginated list of all announcements with status filtering for librarians and admins.
- **FR-006**: The system MUST provide a public endpoint that returns only active, non-expired announcements (expired_date is NULL or >= current date).
- **FR-007**: The system MUST automatically update announcements to `expired` status if their expiration date has passed.

### Key Entities *(include if feature involves data)*

- **Announcement**:
  - `announce_id` (uuid, PK): Unique identifier.
  - `created_at` (timestamp): The creation time.
  - `expired_date` (date): Optional expiry date.
  - `title` (text): Title of the announcement.
  - `content` (text): Body content.
  - `status` (varchar): Status of the announcement ('draft', 'active', 'expired').

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All management endpoints are fully protected using token verification and librarian/admin role verification middleware.
- **SC-002**: Public endpoints are accessible without authentication or role-based restrictions.
- **SC-003**: The system background scheduler automatically runs on startup and hourly to update any active announcements that have expired.
- **SC-004**: All endpoint responses conform to the standard LIMA response envelope structure.

## Assumptions

- We will follow the existing route-controller-service-model pattern using the `announcement.*` namespace.
- The authentication middleware `verifyToken` and `authorizeRole` will be reused directly.
- The background task will run similarly to `pinScheduler.mjs`.
