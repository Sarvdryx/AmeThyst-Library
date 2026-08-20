# Feature Specification: Study Group Logic Hardening

**Feature Branch**: `current branch (no new branch requested)`

**Created**: 2026-07-24

**Status**: Draft

**Input**: Correct the confirmed Study Group logic defects found during the repository-wide audit, preserve valid existing behavior, resolve selected ambiguities in favor of a simple user experience, and reduce the observed join-request delay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep Requests and Invitations Distinct (Priority: P1)

As a participant or invited user, I need join requests and invitations to follow their own decision rules so that nobody can accept an invitation on my behalf or silently remove it through the wrong action.

**Why this priority**: Mixing these two relationship types can bypass recipient consent, produce the wrong notification, and change group capacity incorrectly.

**Independent Test**: Create one Pending join request and one Pending invitation, exercise every approve, deny, cancel, accept, and decline action against both identifiers, and verify that only the action belonging to the relationship type succeeds.

**Acceptance Scenarios**:

1. **Given** a Pending join request, **When** the creator approves or denies it, **Then** the normal request outcome, capacity change, email, bell notification, and destination are applied exactly once.
2. **Given** a Pending invitation, **When** the creator attempts to process it through a join-request approval or denial action, **Then** the operation is rejected and the invitation and capacity remain unchanged.
3. **Given** a Pending invitation, **When** the recipient attempts to cancel it as a normal join request, **Then** the operation is rejected and the invitation remains available for explicit Accept or Deny.
4. **Given** a Pending invitation, **When** its recipient explicitly denies it, **Then** it is removed from the active invitation list, capacity remains unchanged, and the creator receives the specified invitation-declined bell notification only.

---

### User Story 2 - Enforce Study Group Roles and Ownership (Priority: P1)

As a library user, I need Study Group actions to be restricted to the student role and to the correct creator, requester, member, or invitation recipient so that staff identities and unrelated users cannot alter group state.

**Why this priority**: Authorization is a data-integrity and consent boundary shared by every Study Group mutation.

**Independent Test**: Exercise representative create, join, invite, decision, member-management, leave, and dissolve actions as a student, unrelated student, creator, administrator, and librarian, then verify the role and relationship matrix.

**Acceptance Scenarios**:

1. **Given** an authenticated student, **When** they perform an action allowed by their current Study Group relationship, **Then** the action proceeds.
2. **Given** an administrator or librarian, **When** they attempt to create or participate in a Study Group through a direct request, **Then** the operation is rejected without changing group or reservation data.
3. **Given** an authenticated student without the required ownership or relationship, **When** they invoke a protected action directly, **Then** the operation is rejected without disclosing private management data.

---

### User Story 3 - Submit Join Requests Quickly and Recoverably (Priority: P1)

As a user browsing Study Together, I need a join request to begin immediately, show progress, and preserve my message if it fails so that I do not wait several seconds without feedback or submit duplicates.

**Why this priority**: The current interaction can take about five seconds, clears the message before success, and gives no recoverable failure outcome.

**Independent Test**: Submit requests under normal, slow, failed, and repeated-click conditions and verify immediate feedback, one persisted outcome, retained input on failure, and timely completion.

**Acceptance Scenarios**:

1. **Given** an eligible group and valid message, **When** the user presses Send, **Then** visible progress appears immediately and repeat submission is disabled until the result is known.
2. **Given** a successful request, **When** the operation completes, **Then** exactly one Pending relationship appears and the modal closes or presents the established success state.
3. **Given** a failed request, **When** the failure result arrives, **Then** no unpersisted Pending state is shown, the entered message remains available, and a localized recoverable error is displayed.
4. **Given** normal project load, **When** the user sends a valid request, **Then** the visible success or recoverable failure result is presented within two seconds for at least 95% of attempts.

---

### User Story 4 - Access Every Group Through Real Pagination (Priority: P2)

As a user with many discoverable, created, or joined groups, I need page navigation to cover the entire persisted result set so that groups after the first fifty are not hidden.

**Why this priority**: The current lists paginate only a locally loaded subset even though the authoritative result contains more pages.

**Independent Test**: Prepare more than fifty results in each list, navigate from the first through the last page, change filters, and verify that every eligible group is reachable once in the correct order.

**Acceptance Scenarios**:

1. **Given** more results than fit on one page, **When** the user selects another page, **Then** the corresponding authoritative page is displayed.
2. **Given** more than fifty eligible groups, **When** the user traverses all pages, **Then** every eligible group is reachable and none is silently omitted.
3. **Given** the user changes a filter, tab, or search term, **When** the result set changes, **Then** pagination returns to a valid page and reflects the new total.
4. **Given** a realtime change affects the current result set, **When** the list refreshes, **Then** ordering, total pages, and current-page validity remain consistent.

---

### User Story 5 - Validate Creation Without Regressing Valid Reservations (Priority: P2)

As a creator, I need valid future Study Group creation to continue working while malformed or genuinely non-reservable dates are rejected clearly.

**Why this priority**: Existing interactive creation appears to work correctly; hardening must protect the server boundary without changing successful valid flows.

**Independent Test**: Re-run all accepted creation flows and boundary cases, then submit malformed, past, elapsed-today, unavailable, and concurrently claimed selections directly and verify that only invalid selections are rejected.

**Acceptance Scenarios**:

1. **Given** a valid future date and currently available slot selected through the existing interface, **When** the creator submits valid group details, **Then** creation succeeds exactly as before.
2. **Given** a calendar date that does not exist, **When** creation is attempted, **Then** a recoverable validation error is returned and no reservation or group is created.
3. **Given** a past date or a slot whose start time has already elapsed in Vietnam time, **When** creation is attempted directly, **Then** it is rejected without changing data.
4. **Given** a future slot becomes unavailable concurrently, **When** creation completes, **Then** at most one reservation-backed group succeeds and the other user receives the existing unavailable outcome.
5. **Given** investigation shows the existing server already enforces a boundary correctly, **When** hardening is planned, **Then** that path is covered by regression tests and is not changed unnecessarily.

---

### User Story 6 - Keep Contracts, Localization, and Detail Meaning Consistent (Priority: P3)

As a user or system consumer, I need Study Group outcomes and labels to mean what they say so that clients receive the documented result and English or Vietnamese users do not see mixed-language states.

**Why this priority**: Contract and presentation inconsistencies do not always block an action, but they make failures harder to understand and integrations less reliable.

**Independent Test**: Compare documented outcomes with representative creation, dissolution, loading, failure, pagination, and notification-detail flows in both locales.

**Acceptance Scenarios**:

1. **Given** a successfully dissolved group no longer exists, **When** the outcome is returned, **Then** it is documented and presented as deletion confirmation rather than as a group detail that can still be loaded.
2. **Given** the interface is in English or Vietnamese, **When** any Study Group loading, error, status, button, or accessible label is shown, **Then** it uses the selected locale.
3. **Given** a notification event whose member count helps the recipient track capacity, **When** its detail is opened, **Then** Members is shown using the post-commit count.
4. **Given** a removal, leave, denial, cancellation, dissolution, or metadata-update event for which member count does not help the recipient act, **When** its detail is opened, **Then** Members may be omitted while subject, schedule, location, actor, and action identity remain complete.

### Edge Cases

- A request identifier belongs to the correct group but the wrong relationship type.
- A request changes state between detail loading and mutation submission.
- Two approve, accept, cancel, leave, or remove operations arrive concurrently.
- The final available place is claimed concurrently by approval and invitation acceptance.
- Authentication is valid but the account role or account record changes before the mutation.
- A user switches account while a list or notification request from the prior account is still completing.
- A date matches the expected text format but is not a real calendar date.
- The selected date is today and the slot starts exactly now, has just elapsed, or remains in the future.
- A filtered result loses its last item after a realtime update while the user is on the last page.
- Join submission succeeds on the server but the client loses the response; a retry must not create a duplicate active relationship.
- Email delivery fails after a lifecycle transaction commits.
- An invitation email fails and cleanup of the newly created invitation also encounters an error.
- A notification destination becomes stale because the group was dissolved or the recipient relationship changed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every mutation of a join request MUST verify that the target relationship is a join request before changing its status or deleting it.
- **FR-002**: Every mutation of an invitation MUST verify that the target relationship is an invitation and that the authenticated user is the intended decision-maker.
- **FR-003**: A creator MUST NOT be able to accept an invitation on behalf of its recipient through a join-request action.
- **FR-004**: Cancelling a Pending join request MUST NOT delete, deny, or otherwise mutate a Pending invitation.
- **FR-005**: Wrong-type, stale, missing, unauthorized, and capacity-conflict outcomes MUST be distinguishable and MUST leave relationship and member-count state unchanged.
- **FR-006**: Only authenticated student users MUST be allowed to create or participate in Study Groups; ownership and relationship checks from feature 026 remain mandatory.
- **FR-007**: Public discovery and permitted public detail viewing MUST remain available under the rules inherited from feature 026.
- **FR-008**: Sending a join request MUST immediately expose a progress state and prevent repeated submission while the first attempt remains unresolved.
- **FR-009**: A failed join submission MUST preserve the user's message, display localized recoverable feedback, and MUST NOT show Pending unless persistence succeeded.
- **FR-010**: A successful join submission MUST create exactly one active Pending relationship even if the user retries after losing the first response.
- **FR-011**: Under normal project load, at least 95% of join submissions MUST present a success or recoverable failure result within two seconds; the assessment MUST identify whether the observed five-second delay is caused before submission, during processing, or during post-success refresh.
- **FR-012**: Discovery, Created, and Joined lists MUST use authoritative pagination totals and MUST allow every eligible result to be reached beyond the first fifty items.
- **FR-013**: Filtering, searching, tab changes, and realtime updates MUST preserve valid pagination state and authoritative ordering.
- **FR-014**: A Study Group creation date MUST represent a real calendar date.
- **FR-015**: Creation MUST reject dates in the past and same-day slots whose start time is not in the future according to Vietnam local time.
- **FR-016**: Existing valid future reservation and Study Group creation behavior MUST remain unchanged; no creation-path change may be made solely from the audit finding without a failing boundary test or equivalent runtime evidence.
- **FR-017**: Concurrent creation for the same active slot MUST continue to produce at most one successful reservation-backed group.
- **FR-018**: Dissolution documentation MUST describe the actual deletion confirmation returned after the reservation, group, and participation records are removed.
- **FR-019**: Study Group `createdAt` and `updatedAt` MUST be removed from Study Group responses and client view types because the current persisted data cannot represent those events truthfully. Participation, invitation, reservation, and notification timestamps retain their existing meanings.
- **FR-020**: All Study Group user-facing text, recoverable errors, progress states, tooltips, and accessible labels MUST exist in both English and Vietnamese.
- **FR-021**: After the 30-minute denial cooldown, a successful resubmission MUST replace prior Denied relationships for that participant and group with one new Pending relationship; old Denied rows are not retained as user-visible history.
- **FR-022**: Members MUST be displayed for invitation and member-entry outcomes where the recipient needs capacity tracking, using the count after the committed change.
- **FR-023**: Members MAY be omitted from removal, leave, denial, request cancellation, invitation decline, dissolution, and metadata-update details when it does not help the recipient act; all other applicable group, schedule, location, actor, and action information MUST remain present.
- **FR-024**: Existing email and bell event taxonomy, recipient rules, post-commit delivery, navigation behavior, stable identifiers, account-scoped read state, and offline limitations from feature 026 MUST remain unchanged unless this specification explicitly corrects them.
- **FR-025**: Lifecycle email failure MUST NOT roll back or misreport an already committed business mutation.
- **FR-026**: Invitation delivery failure MUST leave no active Pending invitation reported as sent; failure of cleanup MUST be surfaced and logged as an inconsistent outcome rather than reported as ordinary delivery failure.
- **FR-027**: No database schema, migration, or notification persistence change is included in this feature without separate approval.
- **FR-028**: Regression coverage MUST exercise relationship type boundaries, role authorization, strict dates, past/elapsed slots, pagination beyond fifty, join failure recovery, duplicate submission, and documented response shapes through behavior rather than source-text matching alone.
- **FR-029**: The normal-load acceptance check inherited from feature 026 MUST be executed in an approved isolated dataset before performance completion is claimed.
- **FR-030**: Your Study Groups MUST preserve the participation relationship type at the client boundary. Pending invitations MUST be rendered in a dedicated Invitations tab with Accept and Deny only; they MUST NOT be rendered as Pending request cards or expose Cancel Request.
- **FR-031**: Joined MUST include normal request relationships and Approved invitation relationships only. Pending, Denied, expired, or otherwise non-actionable invitations MUST be omitted from Joined, while the Invitations tab MUST expose only Pending invitations whose group can still be acted on.
- **FR-032**: Study Group invitation lookup MUST authorize the recipient's persisted role before creating a relationship: only `user` accounts are eligible, while `librarian` and `admin` accounts are rejected without sending email. Study Together MUST hide Join Group from staff accounts while retaining backend role enforcement against direct requests.
- **FR-033**: Relationship type MUST control Study Together actions: Pending requests expose Cancel Request, while Pending invitations expose Accept Invitation and interpret that action as recipient-authorized invitation acceptance. Card and popup text MUST remain bounded for ordinary and unbroken input, popup actions MUST not shift with title length, and the Invitations dashboard projection MUST be paginated without changing invitation state.

### Critical Service Unit-Test Matrix

The Study Group service regression project MUST keep exactly one primary unit test for each of these critical business boundaries:

1. Reservation and Study Group creation occur in one transaction, in that order, and the generated reservation identifier is linked to the group.
2. An elapsed or unavailable slot omitted by the authoritative availability lookup creates neither a reservation nor a group.
3. A denied join request may be replaced by exactly one new Pending request after the 30-minute cooldown.
4. An existing Pending or Approved relationship prevents duplicate join-request insertion.
5. Approving a Pending join request uses the `request` type boundary, increments member count once, and produces requester/creator notifications.
6. Join-request approve and cancel operations cannot mutate a Pending invitation.
7. Librarian and administrator accounts cannot be invited and receive no invitation email.
8. SMTP failure during invitation creation compensates by deleting the new Pending invitation.
9. Only the intended recipient can accept a Pending invitation; successful acceptance uses the `invite` type boundary and increments member count once.
10. Dissolution snapshots recipients and deletes within the transaction, then dispatches notifications after the committed result.

These tests live in `server/tests/services/study-group.services.spec.mjs` and are registered as the `test_study_group` Vitest project with tags `@SG_1` through `@SG_10`.

### Key Entities

- **Study Group**: A reservation-backed group with creator, metadata, capacity, current member count, lifecycle state, and one scheduled room allocation.
- **Participation Relationship**: A relationship between a user and group, explicitly classified as a join request or invitation and carrying Pending, Approved, Denied, or Expired state.
- **Room Reservation**: The scheduled room allocation whose date, time, owner, availability, and lifecycle determine whether a group can be created or remains active.
- **Notification Event**: A non-duplicating business outcome with actor, recipient, group snapshot, destination, timestamp, and event-specific details.
- **Paged Group Result**: An ordered subset of eligible groups plus the current page, page size, total items, and total pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the complete request/invitation action matrix, 100% of wrong-type operations are rejected without status or member-count changes.
- **SC-002**: In the role matrix, 100% of administrator, librarian, unrelated-user, and wrong-recipient mutation attempts are rejected without data changes.
- **SC-003**: Visible progress begins within 100 milliseconds of pressing Send for a valid join request.
- **SC-004**: Under normal project load, at least 95% of join-request attempts show a definitive success or recoverable failure within two seconds.
- **SC-005**: In failed join-request tests, 100% preserve the entered message, show localized feedback, and avoid an unpersisted Pending state.
- **SC-006**: With at least 75 eligible records in each group list, users can navigate to every record exactly once in authoritative order.
- **SC-007**: All accepted creation regression scenarios continue to pass, while 100% of malformed calendar dates, past dates, and elapsed same-day slots are rejected without partial records.
- **SC-008**: Concurrent final-place, duplicate-request, invitation-decision, and active-slot scenarios produce no duplicate active relationship, capacity overflow, or multiple active reservation.
- **SC-009**: Every Study Group interface state reviewed in both supported locales contains no hardcoded fallback text from the other locale.
- **SC-010**: Documented response examples and actual outcomes agree for 100% of Study Group operations covered by the feature.
- **SC-011**: All targeted behavior tests, client type checks, relevant lint checks, production build checks, and backend Study Group tests pass before completion.
- **SC-012**: The approved normal-load run records the required sample counts, percentiles, error rate, and consistency outcomes without claiming results from a skipped test.

## Assumptions

- Feature 026 remains the baseline for Study Group behavior except where this delta specification explicitly resolves an audit finding.
- Requirements remain an optional ordered list of zero to five non-empty items because that behavior is stated by the user scenarios, business rule, success criterion, tasks, and current accepted implementation in feature 026.
- Resubmission after cooldown replaces prior Denied rows because one current relationship is simpler for users and aligns with the active relationship model; historical analytics are outside this feature.
- Member count is useful for invitation and successful member-entry outcomes, but not mandatory for events where it does not help the recipient decide or track newly occupied capacity.
- Existing valid creation observed through the interface is treated as protected regression behavior. Hardening applies only when a failing test or runtime evidence proves that the server accepts an invalid date or elapsed slot.
- Lifecycle notifications remain browser/account scoped and are not durable across offline periods, device changes, or cleared browser storage; email remains the durable fallback.
- No new database table, column, constraint, or migration is authorized by this specification.
- Study Group `createdAt` and `updatedAt` are removed rather than renamed or derived; adding truthful audit timestamps remains a separately approved schema concern.
- The current design system, modal interactions, email visual treatment, notification timeline, route destinations, light/dark behavior, and bilingual presentation are preserved.
- Performance measurements require an isolated approved dataset because mutation workloads must not alter shared development data.

## Scope Boundaries

### In Scope

- Confirmed audit findings SG-001 through SG-012 and test gaps SG-018 through SG-023.
- Explicit resolution of SG-014 and SG-016 as defined by FR-021 through FR-023.
- Evidence-first validation of SG-004 with preservation of valid creation behavior.
- Diagnosis and reduction of the observed join-request delay.
- Contract, localization, behavioral regression, concurrency, and performance acceptance coverage directly related to Study Group.

### Out of Scope

- New Study Group capabilities, chat, files, recurring groups, waitlists, or participant roles.
- Durable server-side notification storage.
- Database schema or migration changes without separate approval.
- Redesign of the accepted Study Group, email, notification, dashboard, or Room Reservation interface.
- General cleanup or refactoring outside dependencies directly used by Study Group.
