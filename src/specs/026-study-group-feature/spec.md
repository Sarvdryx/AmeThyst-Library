# Feature Specification: Reservation-Backed Study Groups

**Feature Branch**: `feature/StudyGroup`

**Created**: 2026-07-19

**Status**: Functionally Complete — product-owner acceptance recorded; optional performance/usability evidence remains tracked separately

**Input**: User description: "Extend Study Group Mode so students can create a study group as part of a room reservation, manage groups they host, and manage groups they have joined, while preserving Freely Mode."

## Feature Overview

Study Group enables authenticated students to organize an in-person study session in a library study room. Every Study Group is owned by one host and is backed by exactly one valid room reservation. The feature extends the existing Study Group reservation mode with group details and replaces dashboard mock data with persisted information, while leaving the established room, date, and time selection flow—and all Freely Mode behavior—unchanged.

The product value is a single, trustworthy lifecycle: a host secures a physical room while creating the group; participants request to join; the host manages requests and membership before the session; and reservation and group lifecycle events stay synchronized.

### Goals

- Allow a student to complete a Study Group reservation and create its associated group in one coherent journey.
- Ensure no Study Group can exist without exactly one valid reservation.
- Give hosts an accurate, actionable view of groups they created.
- Give participants an accurate view of approved, pending, and denied participation.
- Replace dashboard mock data with persistent, current information while retaining the established presentation patterns.
- Preserve the behavior and user experience of Freely Mode.

### Logical Delivery Boundaries

- **Phase 1 — Reservation-backed creation**: extend Study Group Mode after existing room, date, and time selection; validate group details; create the reservation first and the Study Group second; compensate safely when the second step cannot complete.
- **Phase 2A — Host dashboard and group editing**: replace created-group mock data; order groups by operational priority; allow eligible group details to be edited.
- **Phase 2B — Host membership and lifecycle management**: approve or deny requests, remove members, and dissolve eligible groups while maintaining capacity and reservation consistency.
- **Phase 2C — Participant dashboard actions**: replace joined-group mock data; order participation by request status; allow approved members to leave and pending applicants to cancel requests.
- **Phase 2D — Study Together discovery and join requests**: replace Study Together mock data with persisted groups and make the existing join-request journey create real Pending requests without redesigning its layout.

Each boundary is independently testable, but all boundaries share the reservation-backed Study Group lifecycle defined in this specification.

## Clarifications

### Session 2026-07-19

- Q: What happens to a Study Group after the host dissolves it? → A: Permanently delete its reservation; database cascades permanently delete the linked Study Group and participation rows.
- Q: What happens to participation records when a Study Group is dissolved? → A: All requests and memberships are permanently deleted; dissolved groups retain no history.
- Q: Does feature 026 replace Study Together mock data and enable real join requests? → A: Yes; use persisted group data and create real join requests while preserving the existing presentation and interaction flow.
- Q: When may a participant submit another request after being Denied? → A: After 30 minutes from their most recent Denied decision, provided the group remains eligible.
- Q: How does cancellation release a room slot? → A: Permanently delete the eligible reservation; no Cancelled reservation state is stored.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Study Group with a Room Reservation (Priority: P1)

As an authenticated student using Study Group Mode, I want to provide group information before confirming my selected room session so that the reservation and discoverable study group are created together.

**Why this priority**: A group cannot exist until this journey produces a valid reservation. It is the foundation for every dashboard, membership, and host-management capability.

**Independent Test**: Select an available room, date, and time through the existing flow; choose Study Group Mode; enter valid group details; confirm; and verify that one reservation and exactly one linked Study Group are available to the host, without changing Freely Mode.

**Acceptance Scenarios**:

1. **Given** an authenticated student has selected an available room, date, and time in Study Group Mode, **When** they provide a title, description, one subject, optionally provide up to five non-empty requirements, and confirm, **Then** the reservation is created first and one Study Group linked to its reservation identifier is created second.
2. **Given** the student has entered fewer than five requirements, **When** they choose to add another requirement, **Then** they can provide another bullet item without losing previously entered information.
3. **Given** requirement inputs contain blank or whitespace-only entries, **When** the student confirms, **Then** blank entries are omitted and the remaining zero to five requirements are retained in their entered order.
4. **Given** more than five non-empty requirements are supplied, a required group field is missing, or title/subject contains no letter, **When** the student attempts to confirm, **Then** creation is prevented and the invalid information is clearly identified without losing valid selections.
5. **Given** the room reservation cannot be created, **When** the student confirms, **Then** no Study Group is created and the user is told that the selected session was not reserved.
6. **Given** the reservation succeeds but Study Group creation fails, **When** the workflow handles the failure, **Then** the newly created reservation is cancelled or released, no partial Study Group remains, and the user receives a retryable failure outcome.
7. **Given** the same student uses Freely Mode, **When** they complete the existing reservation flow, **Then** no Study Group information is requested and existing Freely Mode behavior remains unchanged.

---

### User Story 2 - View and Edit Groups I Created (Priority: P2)

As a host, I want my dashboard to show persisted groups in an operationally useful order and let me update eligible group details so that participants see accurate session information.

**Why this priority**: Hosts need reliable visibility and control after creation. Full and upcoming groups are prioritized above sessions already underway or historical groups because they are the sessions most likely to require immediate preparation or membership decisions.

**Independent Test**: Seed a host with groups across all supported lifecycle statuses, open “Group I Created,” verify real data and ordering, edit an eligible group, reopen it, and verify the saved values persist.

**Acceptance Scenarios**:

1. **Given** the current user has created groups in multiple statuses, **When** “Group I Created” loads, **Then** it shows persisted non-cancelled groups rather than mock data ordered by In Progress, Full, Upcoming, Completed, and Expired; cancelled legacy rows are omitted.
2. **Given** multiple groups share a status, **When** they are displayed, **Then** sessions with the nearest scheduled start appear first, with a stable tie-breaker so repeated loads do not reorder equal items unpredictably.
3. **Given** the host opens an Upcoming or Full group, **When** they change the title, description, subject, or requirements to valid values and save, **Then** the persistent group details are updated and the refreshed dashboard shows the changes.
4. **Given** the host opens an In Progress, Completed, or Expired group, **When** details are shown, **Then** historical/session information remains viewable but group details are read-only.
5. **Given** the host submits invalid edited requirements, **When** they attempt to save, **Then** the existing persistent values remain unchanged and the validation problem is identified.
6. **Given** the host has no created groups, **When** the section loads, **Then** a clear empty state is shown without mock entries.

---

### User Story 3 - Manage Requests and Members (Priority: P2)

As a host of an Upcoming or Full Study Group, I want to approve or deny pending requests and remove approved members so that I can control attendance within the room’s capacity.

**Why this priority**: Membership management is the core collaborative behavior after a group exists and must be capacity-safe.

**Independent Test**: Open an Upcoming group with pending and approved participants, exercise each eligible host action, and verify the participant and host views immediately reflect the resulting membership/request state and member count.

**Acceptance Scenarios**:

1. **Given** an Upcoming group has a pending request and available capacity, **When** the host approves it, **Then** the request becomes Approved, the participant becomes a group member, and the member count increases exactly once.
2. **Given** approving a request fills the final place, **When** approval completes, **Then** the group becomes Full and further approvals are unavailable while capacity remains exhausted.
3. **Given** a Full group has a pending request, **When** the host reviews it, **Then** approval is unavailable but denial remains available.
4. **Given** an Upcoming or Full group has a pending request, **When** the host denies it, **Then** it becomes Denied, does not alter membership count, and no longer appears in the pending approval queue.
5. **Given** an Upcoming or Full group has an approved participant other than the host, **When** the host removes that member, **Then** the participant is no longer a member, the member count decreases exactly once, and a formerly Full group becomes Upcoming when capacity is available.
6. **Given** a group is In Progress, Completed, Cancelled, or Expired, **When** the host opens it, **Then** approval, denial, and member-removal actions are unavailable.
7. **Given** two actions compete for the final available place, **When** they are processed, **Then** at most one succeeds and membership never exceeds capacity.
8. **Given** a participant cancelled their pending request before the host acted, **When** the host’s stale view attempts approval or denial, **Then** no membership change occurs and the host is informed that the request is no longer pending.

---

### User Story 4 - Dissolve a Study Group Safely (Priority: P2)

As a host, I want to dissolve a future Study Group so that its room is released and participants are not left with a group that no longer has a reservation.

**Why this priority**: Dissolution is a critical lifecycle operation because reservation and group records must not diverge.

**Independent Test**: Dissolve an Upcoming or Full group at least three hours before its Vietnam-time start and verify its reservation is permanently deleted, the linked group and all participation rows are removed by cascade, and the room becomes available according to existing reservation rules. Repeat just inside the three-hour cutoff and verify no data changes.

**Acceptance Scenarios**:

1. **Given** the host owns an Upcoming or Full group, **When** they confirm dissolution, **Then** the linked reservation is permanently deleted and foreign-key cascades permanently remove the Study Group and every related request/membership.
2. **Given** dissolution succeeds, **When** created/joined/discovery data is refreshed, **Then** the group is absent from every view and its former room slot no longer remains blocked.
3. **Given** reservation cancellation fails, **When** dissolution is attempted, **Then** the Study Group status and memberships remain unchanged and the host receives a clear failure outcome.
4. **Given** any update in the dissolution transaction fails, **When** dissolution is processed, **Then** all reservation, Study Group, and participation changes are rolled back, the prior active state remains consistent, and the host receives a recoverable failure outcome.
5. **Given** the group is In Progress, Completed, Cancelled, or Expired, **When** the host views it, **Then** dissolution is unavailable.
6. **Given** a non-host attempts to dissolve a group, **When** the request is evaluated, **Then** no reservation or group state changes.
7. **Given** an Upcoming or Full group starts in exactly three hours according to Vietnam time, **When** its host confirms dissolution, **Then** dissolution remains allowed.
8. **Given** an Upcoming or Full group starts in less than three hours according to Vietnam time, **When** its host views or attempts to dissolve it, **Then** the action is unavailable and the backend rejects any stale request without changing data.

---

### User Story 5 - Manage Groups I Joined (Priority: P3)

As a participant, I want to see persisted participation states and withdraw appropriately so that I control my commitments and pending requests.

**Why this priority**: Participant self-service completes the collaboration lifecycle and keeps the host’s queue and capacity accurate without manual intervention.

**Independent Test**: Give a participant Approved, Pending, and Denied records; verify ordering; leave the approved group; cancel the pending request; and verify host and participant views immediately reflect both actions.

**Acceptance Scenarios**:

1. **Given** the current user has participation records in several states, **When** “Group I Joined” loads, **Then** it shows persisted non-cancelled data rather than mock data ordered by Approved, Pending, Denied, then Expired; within a participation state, active In Progress, Full, and Upcoming sessions precede Completed or Expired sessions.
2. **Given** multiple records share a participation status, **When** they are displayed, **Then** the nearest scheduled session appears first with deterministic tie-breaking.
3. **Given** the participant is Approved for an Upcoming or Full group starting at least three hours later in Vietnam time, **When** they leave the group, **Then** their membership is removed, the group member count decreases exactly once, a formerly Full group becomes Upcoming when a place opens, and the creator receives a bilingual email plus a targeted notification when connected.
4. **Given** the participant has a Pending request, **When** they cancel it, **Then** it disappears from their pending list and immediately disappears from the host’s approval queue.
5. **Given** the participation is Denied, or the associated group is In Progress, Completed, or Expired, **When** details are viewed, **Then** leave and cancel-request actions are unavailable; an associated Cancelled group is omitted from the dashboard entirely.
6. **Given** the current user has no joined or requested groups, **When** the section loads, **Then** a clear empty state is shown without mock entries.
7. **Given** the reservation starts in exactly three hours according to Vietnam time, **When** an Approved participant leaves, **Then** the action succeeds; inside that boundary, the action is unavailable and the backend rejects a stale attempt without changing membership.

---

### User Story 6 - Discover and Request to Join Real Groups (Priority: P2)

As an authenticated student, I want the Study Together page to show current persisted Study Groups and submit a real join request so that the host can review my request and I can track it in my dashboard.

**Why this priority**: A real request source is required for the host approval queue and participant dashboard to work as one end-to-end product journey.

**Independent Test**: Open Study Together, select an eligible persisted group, submit the existing join-request interaction, and verify one Pending request appears in both the participant’s dashboard and the host’s approval queue.

**Acceptance Scenarios**:

1. **Given** persisted Study Groups exist in multiple lifecycle states, **When** Study Together loads, **Then** it displays only groups whose effective lifecycle status is Upcoming, instead of mock records, while retaining the established layout, filtering, detail, and request interaction patterns.
2. **Given** an authenticated non-host views an Upcoming group with available capacity and has no current request or membership, **When** they submit the existing join-request interaction, **Then** exactly one Pending request is created and appears in the participant and host dashboards.
3. **Given** the user already has a Pending or Approved record for the group, or fewer than 30 minutes have passed since their most recent Denied decision, **When** they attempt another request, **Then** no new request is created and their current state or remaining wait is shown.
4. **Given** at least 30 minutes have passed since the user’s most recent Denied decision and the group remains eligible, **When** they submit again, **Then** prior Denied rows for that user/group are removed and exactly one new Pending relationship is created.
5. **Given** a group is Full, In Progress, Completed, Cancelled, or Expired, **When** a user views it, **Then** submitting a join request is unavailable.
6. **Given** a host views their own group, **When** group actions are shown, **Then** they cannot request to join it.
7. **Given** request submission fails, **When** the interaction completes, **Then** no Pending state is shown unless it was persisted, and the user receives a recoverable error outcome.

### Edge Cases

- A selected room slot becomes unavailable between selection and confirmation; neither a duplicate reservation nor a Study Group is created.
- A reservation identifier is missing, invalid, belongs to another user, already backs another Study Group, or refers to a non-active reservation; Study Group creation is rejected.
- The host submits duplicate requirement text. Each non-empty bullet is preserved as entered because uniqueness was not requested, subject to the five-item maximum.
- Requirement inputs contain only whitespace; they are treated as empty and are not stored.
- The associated room has no usable group capacity; Study Group creation is rejected rather than creating a group that cannot accept its host.
- A host attempts to approve themselves, remove themselves, or act on a request belonging to another group; the action is rejected without changing counts.
- The same participant submits multiple concurrent join requests for one group; at most one current participation/request relationship is recognized.
- A participant requests to join their own group, a Full group, or a group that is no longer Upcoming; the request is rejected.
- A participant submits the same join request concurrently from multiple sessions; at most one current relationship is created for that participant and group.
- A participant retries exactly at the 30-minute boundary after denial; the request is eligible when 30 full minutes have elapsed from the latest Denied decision.
- A group reaches its scheduled start while a host or participant detail view is open; stale management actions are rejected and the refreshed status is shown.
- A reservation is cancelled or invalidated outside the Study Group dashboard; the linked Study Group must not remain active or accept membership actions.
- A request is approved, cancelled, denied, or removed concurrently from different sessions; counts and request state change at most once.
- Historical groups or denied requests remain viewable only according to the existing project’s retention policy; they never expose management actions.
- Temporary loading or retrieval failures show a recoverable error state and never substitute mock data.

## Requirements *(mandatory)*

### Functional Requirements

#### Reservation-Backed Creation

- **FR-001**: The system MUST offer Study Group information collection only when Study Group Mode is selected.
- **FR-002**: The existing room, date, and time selection behavior MUST remain unchanged for both reservation modes.
- **FR-003**: Freely Mode MUST preserve its current fields, validation, confirmation behavior, and outcomes and MUST NOT create a Study Group.
- **FR-004**: Study Group creation MUST require a non-empty title, description, and subject before final confirmation. Title and subject MUST each contain at least one letter; meaningful alphanumeric values remain valid.
- **FR-005**: Each Study Group MUST have exactly one subject.
- **FR-006**: Requirements MUST be treated as an ordered bullet list containing at least one and at most five non-empty items.
- **FR-007**: Users MUST be able to add requirement entries until five non-empty entries are present.
- **FR-008**: The system MUST trim requirement entries for emptiness validation and MUST NOT retain empty or whitespace-only items.
- **FR-009**: Study Group Mode MUST create the room reservation first, obtain its reservation identifier, and create the Study Group second using that identifier.
- **FR-010**: A reservation identifier MUST be mandatory for Study Group creation and MUST reference an active reservation owned by the current host.
- **FR-011**: One reservation MUST back no more than one Study Group, and one Study Group MUST always reference exactly one reservation.
- **FR-012**: If Study Group creation fails after its reservation was newly created, the system MUST cancel or release that reservation so the failed journey leaves no unintended room hold.
- **FR-013**: Group capacity MUST be derived from the capacity of the reserved room; it MUST NOT exceed room capacity, and the host MUST count as the first member.
- **FR-014**: A successful creation MUST appear in the host’s created-groups view without requiring manual data reconstruction.

#### Dashboard Data and Ordering

- **FR-015**: “Group I Created” and “Group I Joined” MUST use persistent current-user data and MUST NOT use mock data as a runtime fallback.
- **FR-016**: Existing dashboard layouts and reusable presentation patterns SHOULD be retained wherever they satisfy these requirements.
- **FR-017**: Any necessary new interface MUST remain consistent with the project’s current visual language, responsive behavior, theme support, localization, accessibility, loading, empty, success, and error patterns.
- **FR-018**: Created groups MUST omit Cancelled records and be ordered by status priority: In Progress, Full, Upcoming, Completed, Expired. The status filter MUST NOT offer a Cancelled option.
- **FR-019**: Within the same created-group status, the nearest scheduled session MUST appear first, followed by a deterministic tie-breaker.
- **FR-020**: Joined participation MUST be ordered by request status priority: Approved, Pending, Denied, Expired. Within the same participation status, active lifecycle states MUST precede historical lifecycle states.
- **FR-021**: Within the same participation status, the nearest scheduled session MUST appear first, followed by a deterministic tie-breaker.
- **FR-022**: Active or actionable records MUST appear above historical records so users see attendance, capacity, and approval work first. Created cards MUST be dimmed only for Completed and Expired groups. Joined cards MUST remain visually active for actionable Approved or Pending participation and MUST be dimmed for Denied or Expired participation, as well as when the associated group is Completed or Expired. Cancelled groups MUST be omitted from both dashboard tabs.

#### Host Editing and Membership Management

- **FR-023**: A host MUST be able to view complete group, reservation/session, membership, and request details for a group they created.
- **FR-024**: A host MUST be able to edit title, description, subject, and requirements only while the group is Upcoming or Full.
- **FR-025**: Edited values MUST follow the same validation rules as creation and MUST persist across reloads.
- **FR-026**: Only the group host MUST be allowed to edit group details or perform host management actions.
- **FR-027**: A host MUST be able to approve a Pending request only while the group is Upcoming and has available capacity.
- **FR-028**: Approving a request MUST change it to Approved, increase the member count exactly once, and change the group to Full when capacity is reached.
- **FR-029**: A host MUST be able to deny a Pending request while the group is Upcoming or Full; denial MUST NOT alter member count.
- **FR-030**: A host MUST be able to remove an Approved participant other than themselves while the group is Upcoming or Full.
- **FR-031**: Removing or voluntarily leaving an Approved membership MUST decrease member count exactly once and change a Full group to Upcoming when capacity becomes available.
- **FR-032**: Approval, denial, member removal, and editing MUST be unavailable when the group is In Progress, Completed, Cancelled, or Expired.
- **FR-033**: Membership operations MUST prevent member count from becoming negative or exceeding capacity, including during concurrent actions.

#### Participant Actions

- **FR-034**: A participant MUST see at most one current participation card per Study Group, reflecting the latest Approved, Pending, Denied, or Expired state. Study Together detail popups MUST include the organizer and current Approved member list as read-only information when additional members exist. Group I Joined continues to render that list only for Approved participation; Pending and Denied Joined popups remain unchanged. Pending request queues and management actions remain host-only.
- **FR-035**: An Approved participant MUST be able to leave only while the associated group is Upcoming or Full and at least three full hours remain before its reservation start instant calculated in Vietnam time. The exact three-hour boundary remains eligible.
- **FR-036**: A participant MUST be able to cancel their own Pending request.
- **FR-037**: Cancelling a Pending request MUST immediately remove it from both the participant’s pending view and the host’s approval queue.
- **FR-038**: Denied participation MUST be read-only and MUST NOT affect group membership count.
- **FR-039**: A host MUST NOT be able to join, leave, or remove themselves through participant membership actions.

#### Lifecycle Integrity

- **FR-040**: Dissolution MUST be available only to the host while the group is Upcoming or Full, MUST require explicit confirmation, and MUST occur at least three full hours before the reservation start instant calculated in Vietnam time. The exact three-hour boundary remains eligible.
- **FR-041**: Dissolution MUST permanently delete the linked reservation; the authoritative `ON DELETE CASCADE` relationships MUST permanently delete the linked Study Group and every Pending, Approved, or Denied participation row.
- **FR-042**: If reservation cancellation fails, dissolution MUST leave the Study Group and its memberships unchanged.
- **FR-043**: Dissolution authorization, reservation deletion, and all cascaded deletion MUST execute within one transaction. If deletion fails, the transaction MUST roll back and the group MUST remain intact.
- **FR-044**: When an associated reservation becomes invalid, cancelled, or unavailable through another workflow, the linked Study Group MUST cease to be active and MUST reject new membership or management changes.
- **FR-045**: Group lifecycle status MUST be evaluated against authoritative server time, the reservation schedule, capacity, and check-in state: Upcoming before start with space, Full before start at capacity, In Progress after start only when the reservation has checked in, Completed after the end only for a checked-in reservation, Cancelled after cancellation, and Expired when the scheduled start is reached without check-in. PIN/check-in completion remains owned by its dedicated reservation verification feature.
- **FR-046**: Every rejected or failed action MUST leave reservation, group, request, and member-count information internally consistent and provide a user-understandable outcome.

#### Study Together Discovery and Join Requests

- **FR-047**: The Study Together experience MUST use persisted Study Group information, MUST NOT display mock groups as a runtime fallback, and MUST display only groups whose effective lifecycle status is Upcoming. Full, In Progress, Completed, Cancelled, and Expired groups MUST NOT appear in Study Together discovery results.
- **FR-048**: Existing Study Together group-detail and join-request interaction patterns MUST be preserved. The Subject filter MUST NOT be shown; the Search Groups input MUST expand into its former space. No user-facing Sort By control is shown; discovery uses the authoritative ordering in FR-058.
- **FR-049**: Only an authenticated non-host with no Pending or Approved participation for the group MUST be able to submit a join request for an Upcoming group with available capacity; if their latest request was Denied, at least 30 full minutes MUST have elapsed since that decision. Groups hosted by the current user and groups in which the current user is already Approved MUST be excluded from Study Together discovery before pagination. Groups with the current user's Pending request MUST remain visible and be ordered before all other discovery results; within each priority group, the nearest reservation start date and time MUST appear first.
- **FR-050**: A successful join submission MUST create exactly one Pending request that becomes visible in the participant’s “Group I Joined” view and the host’s approval queue.
- **FR-051**: The system MUST prevent more than one active Pending or Approved participation relationship for the same participant and Study Group, including during concurrent submissions. After the denial cooldown elapses, resubmission MUST remove prior Denied rows for that participant/group before inserting the new Pending row.
- **FR-052**: Join-request submission MUST be unavailable for Full, In Progress, Completed, Cancelled, or Expired groups and for the group host.
- **FR-053**: A failed join-request submission MUST NOT present a Pending state unless the request was persisted successfully.
- **FR-054**: Reservation cancellation MUST permanently delete an eligible reservation and release its room slot; when that reservation owns a Study Group, its cascades MUST also remove the group and participation rows.
- **FR-055**: Study Together MUST support combined filtering by scheduled date, time range, one or both persisted library branches, and all or any selected eligible rooms. Branch and room options MUST come from current persisted facility data; eligible rooms MUST have capacity of at least one.
- **FR-056**: A guest MUST be able to browse Upcoming groups and see the Join action. Activating Join MUST redirect the guest to authentication and then return them to the selected group without automatically submitting a request.
- **FR-057**: Study Group summaries and popups MUST show the current persisted avatar for hosts, members, and applicants when available and MUST fall back to username initials when no usable avatar exists.
- **FR-058**: Successful Study Group creation, edit, request, approval, denial, cancellation, leave, removal, dissolution, or linked reservation cancellation MUST notify affected open authenticated sessions so Study Together and both dashboard views refresh without requiring manual reload.
- **FR-059**: Reservation dates and `room_avail` start/end times MUST be interpreted in Vietnam's `Asia/Ho_Chi_Minh` timezone throughout storage, lifecycle evaluation, filtering, ordering, and presentation. The selected local calendar date MUST remain unchanged, and the host machine, Node process, database session, or client timezone MUST NOT shift the displayed date or effective Study Group status.
- **FR-060**: A Pending `type=request` card in Study Together MUST expose the same localized, confirmed Cancel Request behavior as Group I Joined and MUST converge with the host queue through the existing realtime refresh path. A Pending `type=invite` relationship MUST expose a localized Accept Invitation action; activating it MUST accept that invitation directly instead of opening the request form or exposing Join Group/Cancel Request.
- **FR-061**: An Upcoming group host with available capacity MUST be able to invite an existing AmeThyst user by email from a circular icon-only action immediately to the right of the Members heading below Organizer inside the Group I Created detail popup. Activating the icon MUST expand one inline email field toward the left without opening another popup; pressing Enter MUST immediately collapse the field and expose a Sending state while SMTP delivery completes. Success or activating the icon again MUST leave the field collapsed and cleared. Failure MUST reopen the submitted email for correction with localized feedback; an unknown address MUST say that no registered account uses that email. Feedback from a completed request MUST NOT reappear in a later popup session. The action MUST retain a localized accessible label/tooltip, and Study cards themselves MUST NOT contain it. No invitation description/message field is shown.
- **FR-062**: A successful invitation MUST create exactly one `group_request` row with `type = invite` and `status = pending`, then send an email using the existing configured mail transport. Only accounts with `users.role = user` are eligible recipients; librarian and admin accounts MUST be rejected before an invitation is created or email is sent. Hosts cannot invite themselves, unknown emails are rejected, and an active Pending or Approved relationship prevents duplicate invitations.
- **FR-063**: Pending, still-actionable Study Group invitations MUST appear both as a typed notification within the authenticated user's existing system-wide notification bell and as a distinct card in a dedicated Invitations tab under Your Study Groups. The tab MUST show only Pending invitations for groups whose scheduled start has not passed, MUST provide Accept and Deny actions, MUST NOT provide Cancel Request, and MUST NOT reuse the Joined request-card presentation. The notification panel header and empty state MUST remain generic so other library features can add notification types later. Selecting a Study Group invitation in the bell MUST open its localized detail popup and identify the creator who performed the invitation using their profile picture when available, username, and email.
- **FR-064**: Email invitation Accept and Deny links MUST return to the matching web invitation. If authentication is required, the login flow MUST return to that URL and the server MUST verify that the authenticated user is the invitation recipient before applying a decision.
- **FR-065**: Accepting an invitation MUST atomically change it to Approved and increment capacity exactly once. After success, the invitation MUST disappear from Invitations, the group MUST appear in Joined, the Joined tab MUST be selected, and a localized joined-success notification MUST be shown. Approved invitations MUST be the only invitation relationships included in Joined.
- **FR-066**: Denying an invitation MUST change it to Denied, remove it from the Invitations tab and notification list, leave member count unchanged, and close the invitation popup when the decision originates there. Denied and expired invitations MUST NOT be retained as dashboard history, and invite denial MUST NOT trigger the 30-minute join-request denial cooldown.
- **FR-067**: Invitation creation, acceptance, and denial MUST emit through the existing Study Group realtime channel. Accept must fail safely if the group is no longer Upcoming or no capacity remains; mail delivery failure MUST remove the newly created Pending invite so the UI never reports a sent invitation that was not delivered.
- **FR-068**: The shared notification tray MUST merge Pending Study Group invitations and lifecycle notifications into one newest-first timeline using `invitedAt` or `createdAt`, with a deterministic identifier tie-breaker. Each item remains compact until selected, showing only its notification type, group title, and relevant actor summary. Its detail popup MUST then present localized Subject/Members, Date/Time, and Branch/Room pairs in that order. Dates and times MUST use the established display format rather than raw database timestamps, and persisted branch/room names MUST use the current locale where translations exist. Opening an invitation MUST mark it read for that account: read invitations remain enabled and selectable but are visually dimmed, while the bell badge counts only unread invitations. The scrollable tray MUST hide the browser-native scrollbar and render a thin rounded overlay scrollbar adapted to light/dark mode, with no native top/bottom arrow buttons.
- **FR-069**: Created and Joined dashboard status controls MUST support selecting any combination of statuses. Results MUST match any selected status, selecting a selected status again MUST remove it, and activating All Status MUST clear every selection and show all records. The Invitations tab MUST NOT expose a status filter because it contains only actionable Pending invitations.
- **FR-070**: Removing an Approved member MUST require a localized in-app confirmation naming the affected member before the removal request is submitted. Cancelling the confirmation MUST leave membership and capacity unchanged.
- **FR-071**: The user Dashboard Calendar and Overview agenda MUST include persisted room reservations and eligible Study Group sessions. A Study Group created by the user or joined with Approved participation MUST appear once in purple using its linked reservation schedule; the user's remaining Freely Mode room reservations MUST appear in blue. Existing book and expiry event behavior remains unchanged.
- **FR-072**: After an Approved member is successfully removed, the system MUST send that former member a bilingual email identifying the Study Group, scheduled reservation, and creator who performed the removal by profile picture when available, username, and email. The matching bell-notification detail MUST present the same performer identity. Email delivery occurs after the membership transaction commits; an SMTP failure MUST be logged but MUST NOT roll back or misreport the successful removal.
- **FR-073**: Before dissolution cascades delete participation records, the system MUST capture every distinct non-host user with an active Approved or Pending request/invitation. After the dissolution transaction commits, each captured user MUST receive a bilingual cancellation email identifying the deleted Study Group, reservation, and creator who performed the dissolution by profile picture when available, username, and email; the matching bell-notification detail MUST present the same performer identity. SMTP failures MUST be isolated per recipient and MUST NOT restore or misreport the permanently deleted group.
- **FR-074**: Successful member removal and dissolution MUST emit a targeted notification through the existing authenticated Socket.IO user room. A connected recipient's browser MUST store an account-scoped snapshot locally, include it in the shared bell unread count, show a compact typed item, and open a localized read-only detail popup. Dissolution/cancellation items MUST use a red warning icon distinct from the purple generic Study Group update icon. Read items remain selectable but dimmed. Because this implementation adds no database storage, delivery to an offline browser or another device is not guaranteed; lifecycle email remains the durable fallback.
- **FR-075**: After an Approved participant voluntarily leaves, the system MUST capture the creator, departing participant, and group schedule before deleting the membership, then send the creator a bilingual email after commit and emit a targeted `member_left` bell notification. Email and bell-notification detail MUST identify the departing participant who performed the action by profile picture when available, username, and email. SMTP failure MUST NOT roll back the successful leave. The bell notification uses the account-scoped local browser storage behavior and offline limitation defined in FR-074.
- **FR-076**: Every Study Group detail popup MUST expose a compact profile preview when the Group Organizer avatar/name or an Approved member avatar/name is hovered or receives keyboard focus. In a host-owned Created popup, the Pending approval queue MUST expose the same preview from each applicant's avatar/name so the host can inspect their profile before Approve or Deny. No preview is shown on the outer Study Card. The preview MUST follow `profile-view-layout.txt` while preserving the accepted popup layout and existing light/dark visual language. It MUST always present Email, Date of birth, Phone number, Gender, Occupation, and Hometown, using a localized Unknown value when persisted data is absent; avatar, name, and role remain in the header. The description region MUST use its natural height up to four lines, show localized Unknown when blank, and truncate longer content at line four with a trailing `..."`. These extended fields MUST be projected by the detail endpoint only and MUST NOT be added to Study Group list/discovery responses.
- **FR-077**: Selecting a Study Together card MUST update the browser URL to `/study-together/{groupId}` and open the existing detail modal through client-side history without reloading or discarding the current filters, loaded discovery data, or scroll position. Created and Joined Dashboard cards MUST provide the equivalent permission-specific routes `/dashboard/user/yourstudygroups/created/{groupId}` and `/dashboard/user/yourstudygroups/joined/{groupId}` while preserving their active tab, status filters, lists, pagination, and scroll state. Closing or browser Back MUST restore the corresponding list URL, while Forward MUST reopen the matching modal. Direct navigation and reload MUST resolve persisted detail independently of list membership, select the correct Dashboard tab where applicable, verify the authenticated relationship matches the route mode, and expose localized loading and unavailable states.
- **FR-078**: Study Group communication MUST use one non-duplicating business-event taxonomy. Invitation received, join request submitted, join request approved or denied, member joined, member removed, member left, and group dissolved MUST produce bilingual email plus a targeted bell notification for their respective recipient. Join request cancelled, invitation declined, and group metadata updated MUST produce targeted bell notifications only. Approval MUST notify the requester with `join_request_approved` and separately notify the creator with one `member_joined` event whose Members value is captured after commit; neither recipient receives two messages for the same outcome. Invitation acceptance produces the same creator-facing `member_joined` event. Metadata updates notify Approved non-host members once per save and identify the changed fields without emailing the creator or Pending users.
- **FR-079**: Notification and email navigation MUST be permission- and state-aware. Creator-facing actionable events navigate to `/dashboard/user/yourstudygroups/created/{groupId}`; Approved-member success/update events navigate to `/dashboard/user/yourstudygroups/joined/{groupId}`; denial, removal, and dissolution navigate to `/dashboard/user/yourstudygroups`. Invitation email links MUST be navigation-only and MUST NOT mutate state when opened or scanned: they open the recipient-authorized invitation detail, where an explicit Accept action applies the decision then opens the Joined detail route, while Deny applies the decision then opens the general Your Study Groups page. Non-action lifecycle email uses the localized label “View your Study Groups,” not “Checkout.” Authentication MUST preserve the intended return URL, every direct detail destination MUST re-authorize the relationship, and stale/deleted destinations MUST fall back safely to the general page or localized unavailable state.
- **FR-080**: Study Group card titles and subject tags MUST truncate with an ellipsis without escaping their card, while detail-popup titles and subject tags MUST display in full and wrap safely without ellipsis, including for unbroken strings. Descriptions and requirements MUST wrap unbroken strings safely; card descriptions remain limited to two lines. Popup Edit Settings and Close actions MUST occupy a fixed right-side cluster on the same row as the tags, independent of title or tag length. The Invitations tab MUST display at most two card rows per page and use the same pagination controls as Created and Joined.

### Non-Functional Requirements

- **NFR-001 — Authorization**: Every create, edit, membership, request, leave, cancellation, and dissolution action MUST verify the current user’s relationship to the affected group and MUST reject unauthorized changes without revealing private management data.
- **NFR-002 — Consistency**: Multi-record lifecycle actions MUST produce one complete business outcome. Creation failures MUST be compensated as defined in FR-012, while dissolution failures MUST roll back atomically as defined in FR-041 through FR-043.
- **NFR-003 — Concurrency**: Simultaneous approvals, leaves, removals, cancellations, and dissolutions MUST not create duplicate membership, exceed capacity, produce negative counts, or act twice on the same pending request.
- **NFR-004 — Responsiveness**: At least 95% of dashboard loads and management actions under normal project load MUST present their result or a meaningful progress state within two seconds.
- **NFR-005 — Accessibility**: All new or extended interactions MUST be keyboard operable, expose meaningful labels and status feedback, retain visible focus, and not rely on color alone to convey status.
- **NFR-006 — Localization and Theme**: All user-facing content MUST support the project’s English and Vietnamese localization and current light/dark theme behavior.
- **NFR-007 — Resilience**: Loading, empty, stale-data, validation, authorization, and service-failure states MUST be distinguishable and recoverable without displaying mock information.
- **NFR-008 — Compatibility**: Existing Freely Mode behavior and unrelated reservation/dashboard functions MUST pass their established acceptance checks after this feature is introduced.
- **NFR-009 — Realtime convergence**: After a successful Study Group mutation, affected open authenticated views MUST converge to authoritative state within two seconds under normal project load, with periodic refresh retained as recovery when realtime delivery is unavailable.

#### Acceptance Measurement Profiles

- **Normal project load**: Performance acceptance uses a seeded environment containing at least 100 users, 23 study rooms, 500 Study Groups, and 2,000 participation records with exactly 25 concurrent clients. The workload mix is 60% reads—15% each for discovery, created, joined, and detail—and 40% mutations—8% each for join submission, approval, denial, Pending cancellation, and voluntary leave.
- **Performance measurement**: The environment MUST be warmed up before measurement; each named operation MUST run at least 100 times; reports MUST record per-operation and aggregate p50, p95, and error rate; server/database startup time is excluded. Dashboard result-or-progress and Pending-cancellation propagation MUST meet their two-second targets at p95 without producing consistency errors.
- **First-time-user study**: SC-002 MUST be evaluated with at least ten participants who have not previously used Study Group Mode. Timing begins after a room slot is selected; participants receive no procedural assistance; success requires a valid reservation and linked Study Group. The study MUST record completion time, completion rate, validation failures, and observed blockers, and the number who finish within four minutes divided by the total number of participants MUST be at least 0.90.

### Business Rules

- **BR-001**: A Study Group cannot exist without a valid reservation and has exactly one reservation; a reservation can be a Freely Mode reservation with no group, but cannot back multiple groups.
- **BR-002**: The reservation owner and Study Group host are the same user.
- **BR-003**: Reservation creation precedes Study Group creation; dissolution deletes the reservation and relies on its foreign-key cascades to delete the group and participation rows atomically.
- **BR-004**: The host counts toward `current_num`; capacity comes from the reserved room and cannot be edited as group metadata.
- **BR-005**: A group has one subject and zero to five stored, non-empty requirement bullets. Requirements are optional; blank entries are discarded without invalidating otherwise valid group details.
- **BR-006**: Upcoming and Full are the only host-manageable statuses. Full permits denial, removal, editing, and dissolution but not approval until capacity becomes available.
- **BR-007**: In Progress, Completed, Cancelled, and Expired groups are read-only for host and participant membership management.
- **BR-008**: Only Pending requests can be approved, denied, or cancelled. Only Approved participation contributes to member count and can be left or removed.
- **BR-009**: The host cannot request membership in or leave their own group through participant actions.
- **BR-010**: Active created groups precede historical groups because upcoming capacity and membership decisions are time-sensitive; Approved and Pending participation precede Denied participation because they represent current commitments or unresolved intent.
- **BR-011**: Dissolving a group changes all Pending requests to Denied; Approved and Denied participation remains as read-only history and no longer represents an active session commitment.
- **BR-012**: A Denied participant may submit again only after 30 full minutes from their latest Denied decision and only if the group is otherwise eligible; the new submission replaces prior Denied history for that participant/group with one Pending relationship.
- **BR-013**: `reserve_room.status` is limited to `pending`, `reserved`, and `used` by the authoritative schema. Cancelling an eligible reservation or dissolving its Study Group permanently deletes that reservation; the linked group and requests are removed by cascade and no Cancelled reservation history is retained. Legacy `study_group.status = cancelled` rows are excluded from both Your Study Groups dashboard lists and never created by the real dissolve flow.

### Key Entities *(include if feature involves data)*

- **Study Group**: A hosted study session with a unique identity, host, exactly one reservation, one subject, title, description, ordered requirements, room-derived capacity, current member count, and lifecycle status.
- **Room Reservation**: The authoritative scheduled room allocation containing the reservation identifier, owner, room availability slot, date, and reservation lifecycle. It must exist before its Study Group is created. Cancellation and Study Group dissolution permanently delete it and release the room slot.
- **Group Request / Participation**: A user’s relationship to a Study Group, including its unique identity, group, participant, optional request message, creation time, and Pending, Approved, Denied, or Expired state. Approved records represent membership; Pending records represent host action queues.
- **Study Room / Availability**: The reserved physical room and scheduled time window. Room capacity establishes the maximum Study Group size.
- **Host**: The authenticated reservation owner who creates the Study Group and may edit, manage membership, or dissolve it while eligible.
- **Participant**: An authenticated student who requested or received membership and may cancel a Pending request or leave an Approved future group.

### Data Compatibility Constraints

- The schema files under `database/init_db/postgres` are the source of truth during planning and implementation for exact names, types, status values, relationships, and constraints.
- Existing schema concepts equivalent to Study Group, group request/participation, room reservation, room availability, and study room MUST be reused rather than duplicated.
- The current schema defines Study Group lifecycle values equivalent to Upcoming, Full, In Progress, Completed, Cancelled, and Expired; planning MUST map user-facing labels to those existing values accurately.
- The current schema defines participation/request values equivalent to Pending, Approved, Denied, and Expired; no unsupported status may be assumed.
- The reservation lifecycle does not store a Cancelled value. Eligible cancellation and Study Group dissolution are permanent deletions.
- Where a required business invariant is not enforced by the current schema—particularly one group per reservation, one current request per participant per group, or cross-record lifecycle consistency—the plan MUST explicitly address enforcement without inventing redundant structures.

## User Workflows

### Workflow A — Create in Study Group Mode

1. The student completes the unchanged room, date, and time selection.
2. The student selects Study Group Mode.
3. The student provides title, description, one subject, and optionally up to five requirement bullets.
4. The system validates all reservation and group information and rechecks slot availability.
5. The system creates the reservation and obtains its identifier.
6. The system creates exactly one Study Group using that identifier and room-derived capacity.
7. The student receives a single successful outcome and can find the group under “Group I Created.”
8. If step 6 fails, the system releases the reservation from step 5 and reports that creation did not complete.

### Workflow B — Host Manages a Group

1. The host opens “Group I Created,” where active groups appear before historical groups.
2. The host opens a group detail view.
3. For Upcoming or Full groups, the host may edit valid group metadata, deny Pending requests, remove Approved participants, or dissolve the group.
4. For Upcoming groups with available capacity, the host may also approve Pending requests.
5. Each successful action refreshes status, member count, membership, and request queues consistently.

### Workflow C — Participant Manages Participation

1. The participant opens “Group I Joined,” ordered Approved, Pending, Denied, then Expired, with active sessions ahead of historical sessions inside each participation state.
2. The participant opens the relevant group or request.
3. For an Approved future group starting at least three hours later in Vietnam time, the participant may leave; capacity and both dashboards update, and the creator receives email plus a targeted bell notification when connected.
4. For a Pending request, the participant may cancel; it immediately leaves both their list and the host queue.
5. Denied and historical participation remains read-only while retained.

### Workflow D — Discover and Request to Join

1. A guest or student opens Study Together and receives only persisted Upcoming groups using the established presentation and filtering experience. For an authenticated student, hosted and Approved groups are excluded before pagination; Pending-request groups appear first, then results are ordered by nearest scheduled start without a Sort By control.
2. They may search across groups and combine date, time, one-or-both branch, and all-or-selected-room filters populated from current facility information. No separate Subject filter is presented.
3. A guest who activates Join is sent to authentication and returned to the selected group without submitting automatically.
4. The authenticated student opens an Upcoming group with available capacity.
5. If the student is not the host, has no Pending or Approved participation, and has satisfied any 30-minute post-denial wait, they submit the existing join-request interaction.
6. One Pending request appears in the participant’s dashboard and the host’s approval queue, and affected open sessions refresh through realtime notification.
7. Ineligible or failed submissions create no duplicate or false Pending state.

### Workflow E — Host Dissolves a Future Group

1. The host opens an Upcoming or Full group whose Vietnam-time reservation start is at least three hours away and requests dissolution.
2. The system explains that the room reservation, Study Group, and all participation records will be permanently deleted and asks for confirmation.
3. On confirmation, the system permanently deletes the room reservation in a transaction, immediately releasing its slot.
4. The database cascades delete the linked Study Group and every participation row; all affected views remove the group after the realtime refresh.
5. Any failure rolls back the complete dissolution transaction; no partial reservation, Study Group, or participation cancellation is committed, in accordance with FR-042 and FR-043.
6. Within the final three hours before start, the client hides the action and the backend independently rejects stale dissolution requests.

## Dependencies and Constraints

- Depends on the existing authentication/current-user identity and authorization behavior.
- Depends on the implemented room selection, availability, and reservation flow from Freely Mode, which remains the behavioral baseline.
- Depends on reliable reservation cancellation/release behavior for failed creation and dissolution.
- Depends on the existing dashboard, Study Group card/detail presentation, theme, localization, and notification patterns; mock data is presentation reference only.
- Depends on the actual schema in `database/init_db/postgres`; prompt terminology must not override that source of truth.
- Must fit the existing room’s physical capacity and the reservation’s scheduled date/time.
- Must not introduce a second source of truth for reservation status, capacity, request status, or group status.

## Assumptions

- Only authenticated student users may create or participate in Study Groups; existing staff/admin oversight, if any, is unchanged and outside this feature.
- Group capacity is the reserved study room’s capacity, and the host occupies one place because the schema requires capacity and initializes membership with the creator.
- Title, description, and subject use the limits already defined by the authoritative schema or existing validation conventions; planning must not silently exceed them.
- Requirement bullets are optional and may repeat; blank bullets are removed, no more than five non-empty bullets are retained, and their entered order is preserved.
- Host editing and all membership changes close once the scheduled session begins.
- “Cancel reservation” permanently deletes the eligible reservation and releases its room slot; no cancelled reservation history is retained.
- Denied and historical records follow existing project retention rules. Cancellation of a Pending request removes it from active user and host views immediately.
- Study Together discovery and join-request submission retain their existing presentation and interaction model while replacing mock behavior with persisted data.
- Stable ordering within the same status uses scheduled start time first; an immutable record identifier may be used only as a deterministic tie-breaker.

## Out of Scope

- Redesigning or changing Freely Mode.
- Changing the existing room, date, or time selection experience.
- Redesigning the Study Together discovery, filtering, group-detail, or join-request composition experience; replacing its mock data and mock submission with persisted behavior and removing the obsolete Sort By control are in scope.
- Creating recurring groups, groups spanning multiple reservations, virtual/online groups, waitlists, invitations to email addresses without an existing AmeThyst account, chat, file sharing, attendance scoring, or participant roles beyond host and participant.
- Transferring host ownership or changing the room, date, or time by editing Study Group metadata.
- Increasing group capacity beyond the reserved room capacity or allowing a host-defined capacity in this phase.
- Implementing new librarian/admin moderation workflows.
- Prescribing exact page layouts, components, endpoints, or code structure; the required reservation Cancelled status and schema constraint alignment are explicitly in scope.
- Generating implementation tasks or implementation code.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of successfully created Study Groups have exactly one valid reservation, and 0 Study Groups exist without a valid reservation.
- **SC-002**: At least 90% of first-time test users can complete a valid Study Group reservation and creation journey without assistance in under four minutes after selecting a room slot.
- **SC-003**: Zero requirements is accepted, 100% of tested sets above five non-empty requirements are rejected, and blank entries are omitted while valid bullet order is preserved.
- **SC-004**: Across creation failure and dissolution tests, 100% of cases avoid an active Study Group without a valid reservation and avoid an unintended held reservation from a failed Study Group creation.
- **SC-005**: “Group I Created” and “Group I Joined” display 0 mock records in all loading, success, empty, and failure scenarios.
- **SC-006**: Created-group and joined-participation ordering matches the specified priority for 100% of acceptance datasets, including deterministic ordering within equal statuses.
- **SC-007**: In concurrent final-place approval tests, membership exceeds room capacity in 0 cases and member count changes more than once for one action in 0 cases.
- **SC-008**: A cancelled Pending request disappears from both the participant’s active pending view and the host’s approval queue within two seconds in at least 95% of normal-load tests.
- **SC-009**: At least 95% of dashboard loads and host/participant actions show current results or meaningful progress feedback within two seconds under normal project load.
- **SC-010**: All established Freely Mode acceptance scenarios continue to pass with no behavioral regression.
- **SC-011**: 100% of new or changed user journeys are usable by keyboard and available in both supported languages and both supported visual themes.
- **SC-012**: In acceptance testing, 100% of successful Study Together join submissions create exactly one Pending request visible to both participant and host, while duplicate and ineligible submissions create 0 additional requests.
