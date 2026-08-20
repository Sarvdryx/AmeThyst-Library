# Feature Specification: Real-Time Librarian Room Management Dashboard

**Feature Branch**: `030-room-management-dashboard`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "read the room_display.md in .specify/template/ and write spec file for me, please read carefully so that you wont miss any information"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Librarian Monitors Room Usage at a Glance (Priority: P1)

A librarian assigned to a library branch opens the Room Management Dashboard and immediately sees a summary of their branch's rooms: the total number of bookings today, how many rooms are currently occupied out of the total, and how many check-ins are pending. All numbers reflect only the rooms belonging to the librarian's own branch.

**Why this priority**: Monitoring room usage is the core purpose of the dashboard. It gives the librarian an immediate sense of branch activity and is the simplest independently usable slice.

**Independent Test**: Can be fully tested by logging in as a librarian, opening the dashboard, and verifying that the today's bookings, currently occupied, and pending check-ins counts appear and match the branch's real data.

**Acceptance Scenarios**:

1. **Given** a librarian is logged in and assigned to a branch, **When** they open the dashboard, **Then** they see the total bookings for today, the currently occupied room count, and the number of pending check-ins.
2. **Given** the librarian's branch has no bookings on the current day, **When** they view the dashboard, **Then** the today's bookings count shows zero rather than an error.
3. **Given** a librarian belongs to one branch while other branches have rooms and reservations, **When** they view any summary number, **Then** the numbers include only data from their own branch.

---

### User Story 2 - Librarian Browses and Filters Active Reservations (Priority: P1)

The librarian views the list of active reservations for their branch. They can search by user name, user ID, or room number, filter by reservation status, and restrict results to a date range. Each row shows the room, user, date, time slot, duration, and status.

**Why this priority**: This is the primary day-to-day working view of the dashboard. It enables the librarian to locate any active reservation quickly and is directly testable on its own.

**Independent Test**: Can be fully tested by opening the Active Reservations list, applying a search term, a status filter, and a date range, and confirming the returned rows match the filters.

**Acceptance Scenarios**:

1. **Given** a librarian is on the dashboard, **When** they search by a user name, user ID, or room number, **Then** the active reservations list narrows to matching entries.
2. **Given** the librarian selects a status from the filter, **When** the list refreshes, **Then** only reservations with that status are shown.
3. **Given** the librarian selects a date range, **When** the list refreshes, **Then** only reservations within that range are shown.
4. **Given** the list is longer than one page, **When** the librarian navigates pages, **Then** they can move forward, backward, and jump to a specific page, with the current position clearly indicated.

---

### User Story 3 - Librarian Views the Daily/Weekly Room Schedule (Priority: P2)

The librarian switches the dashboard to a calendar view to see the room schedule for a selected week or day. Rooms are listed as rows, days as columns, and reservations appear as time blocks in the correct position.

**Why this priority**: This provides the dynamic daily schedule described in the feature overview. It is valuable for planning and is independently testable, but the list view covers most operational needs.

**Independent Test**: Can be fully tested by switching to the calendar view, selecting a week or day, and verifying that reservation blocks appear on the correct room row and day/time column.

**Acceptance Scenarios**:

1. **Given** the librarian is on the dashboard, **When** they switch to calendar view, **Then** rooms appear as rows and days appear as columns with time labels.
2. **Given** reservations exist in the selected week, **When** the calendar renders, **Then** each reservation appears as a block on the matching room row at the correct day and time.
3. **Given** the librarian toggles between week and day views, **When** the view changes, **Then** the schedule re-renders to the chosen granularity without losing accuracy.

---

### User Story 4 - Librarian Views Reservation Details (Priority: P2)

From the active reservations list, the librarian can open a reservation to view its full details. The dashboard itself is read-only: it is a monitoring tool, and no in-dashboard action modifies reservations or rooms.

**Why this priority**: Viewing full reservation details extends the monitoring value of the list view. It depends on the list but delivers independent value as soon as the list exists.

**Independent Test**: Can be fully tested by opening the details of a reservation row and verifying all reservation information is displayed.

**Acceptance Scenarios**:

1. **Given** a reservation row is displayed, **When** the librarian selects the view action, **Then** the full reservation details are shown.
2. **Given** the librarian is viewing the dashboard, **When** they look for actions that modify a reservation or room, **Then** no such actions are available anywhere in the dashboard.

---

### Edge Cases

- What happens when the librarian's branch has zero rooms or zero reservations?
- How does the system handle a search that returns no matches?
- How does the dashboard behave when a currently occupied room count changes while the librarian is viewing it?
- What happens when a reservation's time slot crosses midnight or spans the selected date range boundary?
- How does the dashboard render a reservation that is cancelled or checked out while the librarian is viewing it?
- How does the calendar render overlapping reservations for the same room at the same time, if such data can exist?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict all dashboard data to the rooms and reservations of the logged-in librarian's assigned branch.
- **FR-002**: System MUST display a summary of today's total bookings for the branch.
- **FR-003**: System MUST display the number of currently occupied rooms out of the branch's total rooms.
- **FR-004**: System MUST display the number of pending check-ins for the branch.
- **FR-005**: System MUST provide a search over user name, user ID, and room number in the active reservations list.
- **FR-006**: System MUST allow filtering the active reservations list by reservation status.
- **FR-007**: System MUST allow restricting the active reservations list to a date range.
- **FR-008**: System MUST display each active reservation with its room, user, date, time slot, duration, and status.
- **FR-009**: System MUST paginate the active reservations list and indicate the current page.
- **FR-010**: System MUST provide a calendar view showing rooms as rows, days as columns, and reservations as time-positioned blocks.
- **FR-011**: System MUST allow toggling the calendar view between a weekly and a daily granularity.
- **FR-012**: System MUST allow the librarian to view the full details of a reservation.
- **FR-013**: System MUST present the dashboard as a read-only monitoring tool; no action within the dashboard may modify, edit, or cancel a reservation or room record.
- **FR-014**: System MUST keep displayed data current via live push updates, so that reservations, room status, and occupancy change on the dashboard as soon as the underlying events occur, without the librarian refreshing.

### Key Entities *(include if feature involves data)*

- **study_room**: Represents a physical study room; holds the room name, the branch it belongs to, capacity, amenities (e.g., TVs, boards, sockets, projector), a description, and an image. Rooms are the subject of occupancy tracking and scheduling.
- **room_avail**: Represents a bookable time slot for a room; provides the start and end times that define the duration shown in reservation rows and calendar blocks.
- **reserve_room**: Represents a user's reservation of a room; stores the user, the linked availability slot, the reservation date, the check-in time, the status, and (for check-in flows) the PIN fields.
- **return_room**: Represents the check-out event for a reservation; records the checkout time, used to determine when a reservation is completed.
- **users**: Represents library users (including the librarian); provides the name and ID displayed for each reservation.
- **branches**: Represents library branches; the librarian's assigned branch drives the isolation of all dashboard data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A librarian can load the dashboard and see the branch's room usage summary within 2 seconds on a standard connection.
- **SC-002**: 100% of dashboard data shown to a librarian belongs to their assigned branch.
- **SC-003**: A librarian can locate any active reservation by search, status filter, or date range in under 3 interactions.
- **SC-004**: Displayed reservations, room status, and occupancy reflect live changes within 5 seconds of the underlying event occurring.
- **SC-005**: 100% of visible reservations can be opened to view full details without delay.
- **SC-006**: A librarian can switch between list and calendar views without data loss, and both views stay current within 5 seconds of live changes.

## Assumptions

- The dashboard is a read-only monitoring tool: it does not provide any action that modifies, edits, or cancels reservations or room records. Management of room records is out of scope.
- Data currency is achieved through live push updates so that new reservations, check-ins, and status changes appear on the dashboard within 5 seconds of occurring.
- The librarian's assigned branch is already known from the existing authentication and librarian identity system, and no new login or account process is introduced.
- All data is read from the existing room, availability, reservation, return, user, and branch records; no changes to the underlying data definitions are required.
- The dashboard is accessible only to librarians with the appropriate role; regular users cannot see it.
- The provided interface design is a layout reference only; the final interface must follow this project's existing design system, components, and interaction patterns, including light/dark theme and English/Vietnamese localization.
- The calendar view defaults to a weekly granularity, with a daily option available.
- The design mockup's row action icons are treated as a layout reference only; in this read-only scope, they represent the ability to open reservation details.
