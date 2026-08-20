# Feature Specification: Study Together - Study Group

**Feature Branch**: `feature/StudyGroup`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Tôi muốn tạo một trang xem những học nhóm được tạo ra để kết nối cộng đồng thông qua nút 'STUDY TOGETHER' trên thanh điều hướng trên cùng. - @[specs/013-study-together-study-group] là folder chúng ta sẽ thực hiện trên. - Tham khảo thiết kế giao diện @[specs/013-study-together-study-group/study-together-study-group.txt] nhưng phải đồng bộ hóa với giao diện hiện tại. - Sử dụng mockdata cho phần hiển thị. - Tôi đã tạo folder cần thiết @[client/app/study-together] để code."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Study Groups (Priority: P1)

As a user, I want to access the "Study Together" page from the main navigation bar so that I can discover and view available study groups.

**Why this priority**: Discovering study groups is the core purpose of this feature and is required before any other interaction can take place.

**Independent Test**: Can be fully tested by clicking "STUDY TOGETHER" on the navbar and observing only persisted Upcoming study groups.

**Acceptance Scenarios**:

1. **Given** the user is logged in and viewing any page, **When** they click "STUDY TOGETHER" in the top navigation bar, **Then** they are routed to `/study-together` and see a grid of study groups.
2. **Given** the user is on the Study Together page, **When** the page loads, **Then** it correctly displays only persisted Upcoming groups with their subject, title, two-line description, current leader avatar or initials, schedule, room, and occupancy.

---

### User Story 2 - Filter Groups (Priority: P2)

As a user, I want to combine subject, date, time, branch, and room filters so that I can find a suitable session and location.

**Why this priority**: Enhances the user experience by allowing them to narrow down the list, which is essential if there are many groups.

**Independent Test**: Can be tested by combining the persisted filters and verifying the server-filtered list updates without a full-page reload.

**Acceptance Scenarios**:

1. **Given** the user is on the Study Together page, **When** they combine subject, date, time, one or both available branches, and all or selected eligible rooms, **Then** only Upcoming groups matching every selected criterion are displayed.
2. **Given** the user has Pending requests, **When** filtered results load, **Then** Pending groups appear first and each priority section is ordered by nearest scheduled start without a user-facing Sort By control.

---

### User Story 3 - Join a Study Group (Priority: P3)

As a user, I want to click the "Join Group" button on an available study group so that I can participate in it.

**Why this priority**: This is the call-to-action for the page, though currently it may just be a mock interaction.

**Independent Test**: Can be tested by clicking the "Join Group" button on an available group card.

**Acceptance Scenarios**:

1. **Given** an eligible authenticated non-host views an Upcoming group, **When** they submit Join, **Then** exactly one persisted Pending request is created.
2. **Given** a guest clicks Join, **When** authentication is required, **Then** they are redirected to Login and returned to the selected group after successful authentication without automatic submission.
3. **Given** an authenticated user is the host, **When** Study Together discovery is loaded, **Then** their own groups are excluded before pagination. Groups with the user's Pending participation remain visible but cannot receive another Join request.
4. **Given** a Join request succeeds, **When** the Study Together list refreshes or the page is reloaded, **Then** the same card shows a visible disabled Pending action based on persisted participation rather than transient client state.
5. **Given** the latest request was Denied fewer than 30 minutes ago, **When** the card is shown, **Then** Join remains disabled and the remaining cooldown is communicated; it becomes eligible only after 30 full minutes.
6. **Given** the current user has Approved participation in a Study Group, **When** Study Together loads or receives an approval realtime update, **Then** that group is excluded from discovery before pagination and no Study Card is displayed for it.
7. **Given** the current user has one or more Pending requests, **When** Study Together discovery is loaded, **Then** those Pending cards are ordered before other eligible discovery cards; within each priority group, the nearest scheduled start appears first.
8. **Given** a Study Together card represents the current user's Pending request, **When** they choose Cancel Request and confirm in the web dialog, **Then** the persisted request is removed immediately from Study Together and the host's approval queue.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "STUDY TOGETHER" link in the global top navigation bar pointing to `/study-together`.
- **FR-002**: System MUST display a responsive grid layout of study group cards.
- **FR-003**: System MUST populate Study Together from persisted data and MUST show only groups whose effective status is Upcoming.
- **FR-004**: System MUST support combined subject, date, time-range, branch, and room filtering before pagination. Search, subject, date, From, and To remain in the primary filter row; Library Branches and Rooms appear in an expandable secondary section controlled from the lower-right of the filter container. Branch and room options MUST come from persisted facility data; one or both branches and all or any selected rooms with capacity of at least one MUST be selectable. Facility names MUST use the active locale when a translation exists.
- **FR-005**: System MUST NOT expose a Sort By control. Discovery ordering is server-defined: the current user's Pending-request groups first, followed by all other eligible groups, with nearest scheduled start first inside each section and a stable identifier tie-breaker.
- **FR-006**: System MUST preserve the established Study Together card design independently from dashboard card designs; description is limited to two lines with ellipsis when necessary.
- **FR-007**: System MUST open a "Request to Join" modal when "Join Group" is clicked on an available group. The modal must include an optional message text area (max 100 characters), a Cancel button, and a Send button. The design will be based on the required functions of `join-group-layout.txt` but visually improved to adhere to the system's Atomic Design.
- **FR-008**: Current host, member, and applicant avatars MUST be displayed when available, with username initials as the fallback.
- **FR-009**: Successful Study Group changes MUST refresh affected authenticated open views through the project's realtime channel, with periodic refresh as recovery.
- **FR-010**: Reservation calendar dates MUST be displayed and evaluated without timezone-induced day changes.
- **FR-011**: Authenticated Study Together discovery MUST exclude groups hosted by the current user before pagination and MUST order the current user's Pending-request groups before all other discovery results. Within Pending and non-Pending priority groups, the nearest reservation start date and time MUST appear first.
- **FR-012**: A Pending Study Together card MUST provide a localized Cancel Request action using the established web confirmation dialog. A successful cancellation MUST remove the request from the participant and host views without a full-page loading transition.
- **FR-013**: A Study Together detail popup MUST show the organizer and current Approved members as a read-only list when additional members exist, using persisted avatars with initials as fallback. Pending request details and management actions remain host-only.
- **FR-014**: Inside a Study Together detail popup, hovering or keyboard-focusing the Group Organizer or an Approved member avatar/name MUST show the compact persisted profile preview defined by the full Study Group specification without shifting the accepted popup layout. The outer Study Card MUST NOT show this preview. The six defined detail fields remain visible with localized Unknown fallbacks when blank.
- **FR-015**: Selecting a Study Together card MUST expose its detail popup at `/study-together/{groupId}` without a full-page reload or loss of the current filter, loaded list, and scroll state. Closing the popup or navigating Back MUST restore `/study-together`; Forward MUST reopen the matching popup. Direct access and reload of the detail URL MUST resolve the persisted group by ID and show localized loading and unavailable states when necessary.

### Key Entities

- **StudyGroup**:
  - `id`: Unique identifier
  - `subject`: Category of the study group (e.g., "Computer Science", "Physics")
  - `title`: Name of the group (e.g., "Algorithms & Logic")
  - `description`: Brief detail about the group's activities
  - `leader`: Name/Initials of the group creator/leader
  - `time`: Time slot (e.g., "5:00 PM - 9:00 PM")
  - `address`: Location address
  - `room`: Room number or name
  - `currentMembers`: Number of users currently in the group
  - `maxMembers`: Maximum capacity of the group
  - `status`: Derived status ("Available" or "Full")

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Study Together page loads persisted Upcoming results or meaningful progress within two seconds under normal project load.
- **SC-002**: Filter actions update results without a full page reload while preserving the server-defined Pending-first and nearest-start ordering.
- **SC-003**: All new UI components completely adhere to the Atomic Design system, support Light/Dark mode via Tailwind classes, and use i18n keys for text, avoiding any hardcoded strings.

## Assumptions

- Mock data is a presentation reference only and is never a runtime fallback.
- Facility filter options and filtered Study Group results come from authoritative persisted information.
- The UI will be responsive across mobile, tablet, and desktop devices according to existing system patterns.
