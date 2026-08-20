# Feature Specification: User Dashboard Page

**Feature Branch**: `009-user-dashboard-page`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "help me design a new dashboard page for user(the role field in database) ensure only user can access this page, read the template/UI_des.txt and remove the nav bar and footer because it already exists, base on the rest to build the UI for user dashboard page, the dashboard on nav bar will link to this page, remember to comply with the design structure from constitution.md, make the calendar interactive by displaying real date"

**Route Structure**:

| Role      | Page Path               | Frontend File              |
|-----------|-------------------------|----------------------------|
| user      | `/dashboard/user`       | `client/app/dashboard/user/page.tsx` |
| librarian | `/dashboard/librarian`  | `client/app/dashboard/librarian/page.tsx` *(future)* |
| admin     | `/dashboard/admin`      | `client/app/dashboard/admin/page.tsx` *(future)* |

The existing navbar "Dashboard" link routes to `/dashboard/user`. Future role-specific dashboards will follow the same pattern under the `/dashboard` route group.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Personalized Dashboard (Priority: P1)

A logged-in user with the "user" role lands on the dashboard after logging in or clicking "Dashboard" in the navbar. They see a personalized welcome message with their name, a real interactive calendar showing the current month and today's date highlighted, an upcoming agenda panel listing their scheduled events, and a sidebar navigation for accessing other user-specific sections.

**Why this priority**: This is the core reason for building the dashboard — providing users with an immediate overview of their library activities upon login.

**Independent Test**: Can be fully tested by logging in as a user with the "user" role and verifying that the dashboard page displays the user's name, the current month's calendar with today highlighted, and the sidebar navigation items. Delivers the primary landing experience for users.

**Acceptance Scenarios**:

1. **Given** a user is logged in with the "user" role, **When** they navigate to the dashboard page, **Then** they see a personalized greeting containing their display name
2. **Given** a user is on the dashboard, **When** the page loads, **Then** the calendar displays the correct current month and year with today's date visually highlighted
3. **Given** a user is on the dashboard, **When** they view the sidebar, **Then** they see navigation items: Profile, Borrowed Books, Your Study Groups, Room Reservations, Loan & Fees, Recommended Books

---

### User Story 2 - Role-Based Access Restriction (Priority: P1)

Only users whose database role field is "user" can view the dashboard page. Users with other roles (e.g., "admin") or unauthenticated visitors are shown a clear notification and blocked from the page.

**Why this priority**: Security and data privacy — ensuring only authorized users can access user-specific dashboard content is a fundamental requirement.

**Independent Test**: Can be fully tested by attempting to access the dashboard URL while logged in with a non-user role and while not logged in. Delivers role-based access control for the feature.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they click the Dashboard link or navigate to `/dashboard/user`, **Then** they see a notification/toast message saying "This page requires sign in to use" and are redirected to the login page after dismissing the notification
2. **Given** a logged-in user with role "admin", **When** they try to access the dashboard URL, **Then** they see a notification saying "You do not have permission to access this page" and are redirected to the home page
3. **Given** a logged-in user with role "librarian", **When** they try to access `/dashboard/user`, **Then** they see a notification saying "You do not have permission to access this page" and are redirected to the home page
4. **Given** a logged-in user with role "user", **When** they navigate to `/dashboard/user`, **Then** they are shown the dashboard page

---

### User Story 3 - Interactive Calendar Navigation (Priority: P2)

On the dashboard, users can navigate the calendar by switching between Month, Week, and Day views and moving backward/forward through time periods. The calendar always reflects the actual current date on initial load and updates event indicators based on the selected period.

**Why this priority**: Interactivity of the calendar is explicitly requested ("make the calendar interactive by displaying real date") and provides practical value for users managing their library schedule.

**Independent Test**: Can be fully tested by loading the dashboard and using calendar navigation controls to change months and views. Delivers the interactive calendar experience.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard, **When** they click the left arrow on the calendar, **Then** the calendar shifts to the previous month and updates the displayed month/year label
2. **Given** a user is on the dashboard, **When** they click the right arrow on the calendar, **Then** the calendar shifts to the next month and updates the displayed month/year label
3. **Given** a user is on the dashboard, **When** they click "Week" or "Day" view toggle, **Then** the calendar switches to the corresponding view mode
4. **Given** a user is on the dashboard, **When** they click "Month" view toggle, **Then** the calendar switches back to month grid view

---

### User Story 4 - Upcoming Agenda Panel (Priority: P2)

The dashboard displays an upcoming agenda panel on the right side showing today's and tomorrow's scheduled events (book returns, study groups, room reservations) with times and locations.

**Why this priority**: This helps users quickly see their immediate commitments without navigating elsewhere.

**Independent Test**: Can be fully tested by checking that the agenda panel displays events with correct time, title, and location for today and tomorrow. Delivers a useful at-a-glance scheduling overview.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard, **When** they look at the right-side agenda panel, **Then** they see a "Today" section with events listed with time and description
2. **Given** a user is on the dashboard, **When** they scroll the agenda panel, **Then** they see a "Tomorrow" section with upcoming events
3. **Given** a user is on the dashboard, **When** they view the agenda panel, **Then** they see an "Add Personal Task" button for adding custom events

---

### Edge Cases

- What happens when a user's role field is null or undefined in the database? They should be treated as unauthorized and shown the permission notification.
- How does the calendar handle months where the first day is not Monday? The grid must align day numbers correctly under the right weekday column.
- How does the dashboard respond when the user's name is not set? A fallback greeting (e.g., "Welcome back!") should be shown.
- What happens when there are no upcoming events? The agenda panel should show an empty state message instead of a blank section.
- How does the calendar handle months with varying lengths (28, 29, 30, 31 days)? The grid must only display valid dates for the selected month.
- What happens if an unauthenticated user directly types `/dashboard/user` in the browser URL? They should see the sign-in notification, then be redirected to `/login`.
- What happens if a librarian role user navigates to `/dashboard/user` in the future? They should see the permission notification and be redirected to `/` home page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict dashboard page access to authenticated users whose role field equals "user"
- **FR-002**: System MUST display a notification "This page requires sign in to use" to unauthenticated visitors, then redirect them to the login page
- **FR-003**: System MUST display a notification "You do not have permission to access this page" to users without the "user" role, then redirect them to the home page
- **FR-004**: System MUST display a personalized welcome message showing the logged-in user's name
- **FR-005**: System MUST display a sidebar navigation containing: Profile, Borrowed Books, Your Study Groups, Room Reservations, Loan & Fees, Recommended Books
- **FR-006**: System MUST display an interactive calendar that initially shows the current real month and year
- **FR-007**: System MUST visually highlight today's date on the calendar
- **FR-008**: System MUST allow users to navigate the calendar backward and forward by month
- **FR-009**: System MUST support view toggling between Month, Week, and Day views
- **FR-010**: System MUST display an upcoming agenda panel showing today's and tomorrow's scheduled events
- **FR-011**: System MUST provide an "Add Personal Task" button in the agenda panel
- **FR-012**: System MUST load the calendar and agenda data from the backend API with proper loading, empty, and error states
- **FR-013**: The "Dashboard" link in the existing navbar MUST route to this user dashboard page
- **FR-014**: System MUST render the dashboard page content between the existing site-wide navbar and footer, without duplicating them

### Key Entities *(include if feature involves data)*

- **User**: Represents a library member or staff. Contains role field which determines access level ("user" vs "admin"). Display name used for personalized greeting.
- **Calendar Event**: Represents a scheduled activity on a specific date (book return, study group, room reservation, personal task). Has date, time, title, location, and type.
- **Agenda Item**: A time-bound event displayed in the upcoming agenda panel. Subset of calendar events for today and tomorrow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with the "user" role can access the dashboard within 2 seconds of page load
- **SC-002**: 100% of unauthenticated or unauthorized access attempts are correctly redirected or denied
- **SC-003**: The interactive calendar correctly displays the real current date without requiring manual user input
- **SC-004**: Users can navigate between months using calendar arrows with no page reload
- **SC-005**: The agenda panel shows today's and tomorrow's events without requiring a separate page visit

## Assumptions

- The existing authentication system already provides user session data including the user's role and display name
- The existing navbar and footer components can wrap the dashboard page without modification
- Backend API endpoints exist or will be created to serve calendar events and agenda data for the logged-in user
- The sidebar navigation items link to pages that already exist or will be built separately
- The dashboard design from UI_des.txt represents the intended visual layout, with navbar and footer sections excluded since they are already implemented
- Hardcoded color values in the design reference will be replaced with theme-aware design tokens or Tailwind dark mode utilities per the project constitution
- All user-facing text will use the i18n localization system (English/Vietnamese) rather than hardcoded strings
- The page is located at `client/app/dashboard/user/page.tsx` following Next.js App Router conventions, keeping the file path aligned with the user role for future addition of `/dashboard/admin` and `/dashboard/librarian`
- A shared dashboard layout at `client/app/dashboard/layout.tsx` will house the sidebar and any common guards, with role-specific content rendered by each role's page
- The notification system (toast/banner) already exists or will be built as a reusable atom component for displaying auth-related messages
