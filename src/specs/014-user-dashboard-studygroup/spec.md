# Feature Specification: User Dashboard - Your Study Groups

**Feature Branch**: `feature/user-dashboard-studygroup`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Tôi muốn tạo một trang con trong trang dashboard để người có thể quản lý những nhóm học tập mà họ đã tham gia. Bao gồm mục Group I Created và Group I Joined, bỏ phần Manage Groups trong thiết kế giao diện. Một số lưu ý: - Làm việc trên folder @[specs/014-user-dashboard-studygroup] , @client\app\dashboard\user\yourstudygroups - Tham khảo bố trí giao diện @[specs/014-user-dashboard-studygroup/dashboard-StudyGroup-Created-layout.txt] cho Group I Created. - Tham khảo bố trí giao diện @[specs/014-user-dashboard-studygroup/dashboard-StudyGroup-Joined-layout.txt] cho Group I Joined. - Tái sử dụng cách hiểu thị study card và pop up khi nhấn vào của trang Study Group vừa thực hiện."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Joined Study Groups (Priority: P1)

As a user, I want to view a list of study groups I have joined in my dashboard so that I can keep track of my active learning sessions.

**Why this priority**: Managing joined groups is the primary value of this dashboard page for standard users.

**Independent Test**: Can be fully tested by navigating to `/dashboard/user/yourstudygroups` and verifying the "Group I Joined" section displays the current user's persisted participation.

**Acceptance Scenarios**:

1. **Given** the user is viewing their "Your Study Groups" dashboard page, **When** they look at the "Group I Joined" section, **Then** they see a grid of Study Group Cards representing their joined groups.
2. **Given** the user clicks on a joined study group card, **When** the popup opens, **Then** it presents participant-specific details and only eligible Leave or Cancel Request actions using the established Joined popup design.

---

### User Story 2 - View Created Study Groups (Priority: P1)

As a user, I want to view a list of study groups I have created so that I can manage or review them.

**Why this priority**: Essential for users who organize study sessions to see their own creations.

**Independent Test**: Can be tested by navigating to `/dashboard/user/yourstudygroups` and verifying the "Group I Created" section.

**Acceptance Scenarios**:

1. **Given** the user is viewing their "Your Study Groups" dashboard page, **When** they look at the "Group I Created" section, **Then** they see a grid of Study Group Cards representing the groups they own.
2. **Given** the user clicks on a created study group card, **When** the popup opens, **Then** it presents the established host-specific popup with eligible editing, request, membership, and dissolution actions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dashboard subpage at `/dashboard/user/yourstudygroups`.
- **FR-002**: System MUST display two main sections on this page: "Group I Joined" and "Group I Created".
- **FR-003**: System MUST NOT include the "Manage Groups" section from the original design layouts.
- **FR-004**: System MUST preserve the original Created and Joined card presentations. The reference image applies to Created only; Joined MUST follow its earlier code and layout rather than copying Created.
- **FR-005**: Created and Joined popups MUST preserve their distinct presentation, permissions, status information, and available actions even when they share reusable lower-level components.
- **FR-006**: System MUST use persisted created and joined information and MUST NOT use mock records as a runtime fallback.
- **FR-007**: Created groups MUST be ordered In Progress, Full, Upcoming, Completed, then Expired; only Completed and Expired cards are dimmed. A dissolved group is permanently deleted and disappears; any legacy Cancelled row remains last and dimmed.
- **FR-008**: Joined participation MUST contain at most one card per Study Group, using the participant’s latest relationship, ordered Approved, Pending, Denied, then Expired, with active sessions before history; Denied and Expired cards are dimmed.
- **FR-009**: Upcoming and Full created groups are editable and manageable subject to capacity-specific permissions. Dissolution is additionally available only until the exact point three hours before the reservation start calculated in Vietnam time. In Progress, Completed, and Expired groups are read-only; any legacy Cancelled row is also read-only.
- **FR-010**: An Approved participant opening a Group I Joined popup MUST see the organizer and the current Approved member list with avatars/fallback initials. This list is read-only for participants; the Group I Joined interface MUST NOT render it for Pending or Denied participation.
- **FR-010**: Pending-request counts MUST remain inside the Created card footer and the host popup MUST show the authoritative request queue. Full groups may deny requests but may not approve until capacity is available.
- **FR-011**: Current avatars MUST be shown for hosts, members, and applicants when available, with username initials as fallback.
- **FR-012**: Successful Study Group changes MUST update affected open authenticated dashboard sessions through realtime notification, with periodic refresh as recovery.
- **FR-013**: Group I Created MUST provide All Status, In Progress, Full, Upcoming, Completed, Cancelled, and Expired filters in lifecycle priority order. Group I Joined MUST provide All Status, Approved, Pending, Denied, and Expired/History filters. Users MAY select multiple individual statuses; results match any selected status, selecting one again removes it, and All Status clears all selections and shows all records. Each filter change resets pagination to page one and preserves the established dashboard visual language.
- **FR-014**: Removing an Approved member from Group I Created MUST first open a localized in-app confirmation that identifies the member; no removal request is submitted when the host cancels.
- **FR-015**: Pending Study Group invitation and lifecycle notification items MUST share one newest-first timeline based on their authoritative invitation/creation timestamps and remain compact until selected. Their detail popup MUST display the action performer with profile picture when available, username, and email, followed by localized Subject/Members, Date/Time, and Branch/Room pairs without raw database date/time values. Lifecycle notification detail popups for removal, voluntary leave, and dissolution MUST expose the same performer identity block; dissolution/cancellation items MUST use a distinct red warning icon. Opened items remain selectable but are dimmed, and the bell badge counts unread items only. The tray MUST hide the native scrollbar and use a thin rounded light/dark overlay scrollbar without native arrow buttons.
- **FR-016**: The main user Dashboard Calendar and Overview agenda MUST merge persisted Created Study Groups, Approved Joined Study Groups, and the user's room reservations, deduplicate linked reservations, render Study Groups in purple, and render remaining Freely Mode reservations in blue.
- **FR-017**: Group I Joined MUST expose Leave only until the exact point three hours before the reservation start in Vietnam time. A successful voluntary leave MUST notify the creator by bilingual email and, when connected, by the existing account-scoped local notification-bell mechanism naming the departing member.
- **FR-018**: Created and Approved Joined Study Group detail popups MUST show the same compact profile preview when the Group Organizer or an Approved member avatar/name is hovered or keyboard-focused. The host approval queue in a Created popup MUST also expose this preview from each Pending applicant's avatar/name before the host chooses Approve or Deny. Outer Study Cards MUST remain unchanged and MUST NOT show the preview.
- **FR-019**: Selecting a Group I Created or Group I Joined card MUST open its existing permission-specific detail popup at `/dashboard/user/yourstudygroups/created/{groupId}` or `/dashboard/user/yourstudygroups/joined/{groupId}` through client-side history without a full reload or loss of the active tab, selected status filters, loaded lists, pagination, or scroll state. Back/Forward MUST close and reopen the matching popup. Direct access and reload MUST select the route's tab, verify the authenticated user's matching host/participant relationship, resolve persisted detail when absent from the loaded list, and show localized loading/unavailable states rather than the wrong popup mode.

### Key Entities

- **StudyGroup** (Reused from `mockData.ts`):
  - `id`, `subject`, `title`, `description`, `leader`, `time`, `address`, `room`, `currentMembers`, `maxMembers`, `status`, `requirements`, `members`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The "Your Study Groups" dashboard presents persisted results or meaningful progress within two seconds under normal project load.
- **SC-002**: UI layout accurately reflects the structural requirements of the provided text layouts while omitting the "Manage Groups" section.
- **SC-003**: 100% component reuse achieved for `StudyGroupCard` and `StudyGroupInfoModal` without duplicating their source code.

## Assumptions

- Mock data and reference images are presentation references only and are not runtime data sources.
- The dashboard layout wrapper (sidebar, header, etc.) already exists or is out of scope for this specific subpage implementation.
- Filtering and pagination are not explicitly required for this dashboard view unless there are many groups (assumed simple grid view for now).
