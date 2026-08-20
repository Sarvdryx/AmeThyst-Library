# Quickstart: Validate Reservation-Backed Study Groups

## Prerequisites

- PostgreSQL initialized from `database/init_db/postgres/01_databook.sql` through `06_indexes.sql`.
- Server environment configured in `server/.env`, including port 5000 and database/JWT values.
- Client environment configured with `NEXT_PUBLIC_API_URL=http://localhost:5000`.
- At least two authenticated student accounts and one positive-capacity study room with availability slots.

## Start the Application

```powershell
cd server
npm.cmd install
npm.cmd run dev
```

In another terminal:

```powershell
cd client
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Automated Verification

```powershell
cd server
npm.cmd test
npm.cmd audit
```

```powershell
cd client
npm.cmd run sync-locales
npm.cmd run lint
npm.cmd run build
npm.cmd audit
```

The repository currently has pre-existing client lint findings; feature validation must introduce no new findings, and production build must succeed.

## Scenario 1: Freely Mode Regression

1. Sign in as Student A and open a positive-capacity room from the map.
2. Select Freely Mode, a future date, and an available slot.
3. Confirm the reservation.
4. Verify the reservation succeeds exactly as before and no Study Group is created.

Expected: existing labels, availability behavior, confirmation, and dashboard reservation behavior remain unchanged.

## Scenario 2: Atomic Study Group Creation

1. Select Study Group Mode for an available slot.
2. Enter title, description, and one subject; optionally enter up to five requirements. Verify title and subject containing only numbers or symbols are rejected while meaningful alphanumeric values are accepted.
3. Include one blank requirement among valid items and confirm.
4. Verify one reservation and one linked Study Group are returned; blank requirement is absent; capacity equals the room; current count is one.
5. Simulate a group insert failure and repeat with another slot.

Expected: failure rolls back the reservation; no unintended slot remains held.

## Scenario 3: Discovery and Join Request

1. Sign in as Student B and open Study Together.
2. Verify persisted groups load with the existing search/filter/card/detail presentation and no Sort By control.
3. Request to join Student A’s Upcoming group.
4. Verify one Pending record appears in Student B’s joined dashboard and Student A’s approval queue.
5. Retry from another browser session concurrently.

Expected: only one active request exists; no mock record is shown.

## Scenario 4: Denial and Cooldown

1. As Student A, deny Student B’s Pending request.
2. As Student B, attempt to reapply before 30 minutes.
3. Verify a conflict shows the authoritative retry time.
4. Set up a denial exactly 30 full minutes in the past and retry.

Expected: the boundary retry succeeds with one new Pending row and prior Denied history remains.

## Scenario 5: Approval and Full Capacity

1. Create enough Pending requests to approach capacity.
2. Approve requests until one place remains.
3. Submit two concurrent approvals for the final place.

Expected: at most one approval succeeds, count never exceeds room capacity, and group becomes Full. Further approval is unavailable, while denial/removal/edit/dissolve remain eligible.

## Scenario 6: Leave and Remove

1. As an Approved participant, leave an Upcoming/Full group starting more than three hours from now in Vietnam time.
2. Verify count decreases once and Full returns to Upcoming when applicable.
3. Verify the creator receives a bilingual email and, while connected in another browser, a `member_left` bell notification naming the participant.
4. Repeat at exactly three hours before start, then one millisecond inside the cutoff; verify the boundary succeeds and the inside-cutoff request returns `LEAVE_CUTOFF` without changing membership.
5. Recreate approval; as host, remove that participant.
6. Repeat against In Progress/Completed groups.

Expected: future-group actions succeed transactionally; historical/in-progress actions are rejected without count drift.

## Scenario 7: Metadata Editing

1. As host, edit title, description, subject, and requirements on Upcoming and Full groups.
2. Try zero requirements, six requirements, and whitespace-only values.
3. Try editing as another user and after session start.

Expected: valid updates persist; invalid/unauthorized/stale updates do not change stored values.

## Scenario 8: Dissolution and Slot Reuse

1. Prepare an Upcoming group starting more than three hours from now in Vietnam time with Pending, Approved, and Denied participation.
2. As host, confirm dissolution.
3. Verify the reservation is deleted and the linked group plus all Pending/Approved/Denied request rows are removed by cascade.
4. Verify the same room slot can be reserved again.
5. Simulate a failure during the transaction.

Expected: the deletion commits atomically or rolls back; after success the room slot is free and no dissolved group history remains.

Repeat with one group starting exactly three hours from now and another starting one millisecond inside the cutoff. Expected: the exact-boundary group can be dissolved, while the later attempt is hidden by the client and rejected with `DISSOLVE_CUTOFF` by the backend without deleting any row.

## Scenario 9: Dashboard Ordering

1. Seed created groups in all lifecycle statuses and joined records in Approved/Pending/Denied.
2. Open both dashboard tabs.

Expected:

- Created: In Progress → Full → Upcoming → Completed → Expired. Cancelled fixtures and real dissolved groups do not appear, and the status filter has no Cancelled option.
- Joined: Approved → Pending → Denied.
- Equal statuses: nearest scheduled start first with deterministic ID tie-breaker.
- Loading, empty, and error states never substitute mock data.

## Scenario 10: UX, Theme, Localization, and Accessibility

1. Repeat creation, discovery, dashboard, and confirmation actions in English and Vietnamese.
2. Repeat in light and dark themes at mobile, tablet, and desktop widths.
3. Navigate all fields, cards, tabs, dialogs, and actions by keyboard; close dialogs with Escape.
4. Inspect labels, focus, disabled/in-flight feedback, and status announcements.

Expected: mirrored translations, no hard-coded touched strings, readable theme states, visible focus, labelled dialogs, and no color-only status meaning.

## Implementation Verification Log

### US1 checkpoint

- Confirmed the authoritative schema uses UUID `reserve_room.reserve_id`, integer `room_avail.avail_id`, `study_group.created_by`, `study_group.reserve_id`, and room-derived `study_room.capacity`.
- Creation is implemented as one server transaction: reservation insert precedes Study Group insert, and any failure rolls back both.
- Requirements are optional; entries are trimmed, blanks are removed, and at most five non-empty entries are accepted by client and server validation.
- Verify the selected reservation calendar date remains identical in Study Together and both dashboard views in the configured local timezone.
- With two authenticated browsers open, verify successful join, approve, deny, cancel, leave, remove, edit, dissolve, and linked reservation cancellation actions refresh affected views within two seconds without manual reload.
- Server checkpoint: creation ordering/validation and deletion-based cancellation regression suites pass.
- Client checkpoint: locale dictionaries synchronized, touched Study Group files lint with no errors, and the Next.js production build completed successfully.
- Full ESLint still reports pre-existing errors in unrelated files; those findings are not introduced by US1 and remain for the release-hardening task.

### Automated release-hardening checkpoint

- Record the final full-server test count and date after the closing run; do not reuse an earlier count after Study Group behavior changes. The opt-in normal-load suite remains skipped unless `RUN_STUDY_GROUP_PERF=true` and its seeded IDs/token are supplied.
- Server and client production dependency audits: 0 vulnerabilities.
- Client: locale synchronization and production build passed; targeted lint for every changed Study Group file has 0 errors and one pre-existing room-image optimization warning.
- Contract/lifecycle/external-cancellation suites cover every route, terminal status derivation, permanent room cancellation, and stale action rejection.
- Product-owner acceptance: the required functional and presentation flows were manually verified on 2026-07-22. Automated regression, lint, TypeScript, and production-build results must still be recorded from the final closing run.
- Remaining external/non-blocking release evidence: seeded 25-client performance execution and the ten-person first-time-user study, when required by the final academic submission criteria.

### Functional closing run — 2026-07-22

- Server: 28 test files passed and 1 opt-in performance file skipped; 93 tests passed and 1 skipped.
- Added regression coverage for Pending-first/nearest-start discovery contract, creator/Approved exclusion documentation, the exact 30-minute cooldown boundary including Vietnam-offset timestamps, and authoritative capacity refresh after approval.
- Client TypeScript: `tsc --noEmit` passed.
- Study Group targeted ESLint: 0 errors and 2 existing `<img>` optimization warnings.
- Locale synchronization and Next.js production build passed; `/study-together` and `/dashboard/user/yourstudygroups` were generated successfully.
- Full-repository ESLint remains blocked by 18 errors and 11 warnings in unrelated existing components/providers outside the Study Group scope; no unrelated files were modified as part of this closing run.

## Scenario 11: Email Invitation and Notifications

1. Open an Upcoming Group I Created popup with available capacity and select the circular Invite icon beside Members. Verify one email field expands inline toward the left, no extra popup or description field opens, and no Invite action is rendered directly on the Study Card.
2. Enter an existing account email and press Enter; verify the field collapses, a Pending `type=invite` relationship is created, and one email is delivered. Reopen it and press the icon again to verify it clears and collapses without sending.
3. In the invited account, open Your Study Groups and verify a dedicated Invitations tab renders the Pending invitation as an invitation card with Accept and Deny, never Cancel Request, and no status filter. With more than six invitations, verify only six cards (two desktop rows) appear per page and the shared dashboard pagination reaches the remainder. Open Study Together and verify the invited group retains Join Group rather than Cancel Request; activating it accepts the invitation directly. Confirm the same invitation remains available in the system-wide notification bell until resolved; selecting it there opens details identifying the creator by avatar when available, username, and email, while the panel header, subtitle, and empty state remain generic rather than Study Group-specific.
4. Accept from the Invitations card, the bell popup, and an email link; verify recipient authorization, one capacity increment, realtime host refresh, removal from Invitations, appearance in Joined, Joined-tab selection, and the joined-success notice.
5. Repeat with Deny; verify the invitation disappears from both Invitations and the bell, capacity is unchanged, no Denied invitation history appears in Joined, and a later normal Join request has no invitation-denial cooldown. Let another invitation pass its scheduled start and verify it is no longer listed in Invitations or Joined.
6. Verify unknown email, librarian/admin recipient, self-invite, duplicate active relationship, Full/stale group, wrong recipient, concurrent final-place acceptance, and mail failure produce no inconsistent Pending/Approved state. Sign in as a librarian and verify Study Together remains browsable but does not render Join Group or open its join modal.

Automated checkpoint (2026-07-22): full backend suite passed 95 tests with 1 opt-in performance test skipped; invitation/contract regression passed 5 tests; client TypeScript, synchronized EN/VI locales, targeted invitation ESLint with no errors, and Next.js production build passed.

## Scenario 12: Dashboard Filters, Member Confirmation, and Calendar

1. In both Your Study Groups tabs, select two individual status chips and verify the grid includes either status. Select one again to remove it, then select All Status and verify all individual selections are cleared.
2. Open an eligible Group I Created popup and select Remove on an Approved member. Verify the localized web confirmation names that member, cancellation changes nothing, and confirmation removes the member and refreshes capacity.
3. Open the notification bell as an invited user with a mixture of invitations and lifecycle notifications. Verify all types share one newest-first timeline, with equal timestamps resolved deterministically. Confirm Invitation, Member Removed, Member Left, and Cancellation items are distinguishable before reading their summaries through separate semantic background tints, SVG icons, and explicit localized action labels, without a colored bar on the left; cancellation remains the red warning treatment. Select each type and verify its detail popup begins with a matching large status banner while retaining actor identity and all applicable schedule metadata. For invitations, verify Subject/Members, Date/Time, and localized Branch/Room remain three two-column rows. Close and reopen the tray: opened items remain clickable but are dimmed, and the badge counts only unread items. Scroll the tray in light and dark mode and verify the browser-native scrollbar is hidden and the rounded overlay scrollbar has no top/bottom triangle buttons.
4. Open the main Dashboard with one Created or Approved Joined Study Group and one Freely Mode reservation. Verify the linked Study Group reservation appears exactly once in purple and the Freely Mode reservation appears in blue in both Calendar and Overview.
5. Verify book-return, PIN-expiry, and reservation-expiry events remain unchanged.

Automated checkpoint (2026-07-23): dashboard UI regression passed 4 tests; full backend suite passed 100 tests with 1 opt-in performance test skipped; client TypeScript, locale JSON validation, and targeted ESLint for all touched frontend files passed. Both `/dashboard/user` and `/dashboard/user/yourstudygroups` returned HTTP 200 from the existing development server.

## Scenario 13: Lifecycle Notification Emails

1. Remove an Approved member from an eligible Group I Created popup. Verify membership/capacity commit once and that only the removed account receives a bilingual email containing the group, reservation schedule, and creator identity with avatar when available, username, and email. Verify the matching bell detail shows the same actor.
2. Dissolve a group containing Approved members, Pending join requests, and Pending email invitations. Verify all distinct active non-host accounts receive a bilingual cancellation email after the reservation/group/request cascade commits; the host and Denied historical users receive none. Verify both email and bell detail identify the creator who performed the dissolution.
3. Force SMTP delivery failure for removal and for one dissolution recipient. Verify the successful database mutation is not rolled back or reported as failed, remaining dissolution recipients are still attempted, and the mail failure is logged without exposing credentials.
4. Keep an affected account connected in another browser and repeat removal/dissolution. Verify the bell badge increments immediately, a compact typed notification appears, selecting it opens the localized schedule snapshot plus performer avatar/username/email, and reopening the bell shows the still-clickable item dimmed.
5. Have an Approved participant leave an eligible group. Verify the creator's email and bell detail identify that departing participant as the performer with avatar when available, username, and email.
6. Reload that same browser and verify the notification remains. Repeat while the recipient is offline or on a different device and verify no web-notification persistence is claimed; the lifecycle email remains the durable fallback because no notification table was added.
7. Compare invitation, member-removal, voluntary-leave, and dissolution emails in the inbox and after opening them. Verify each subject begins with a distinct bilingual action prefix and each body begins with a large action-specific icon, label, title, semantic color, and plain-language outcome. Verify the actor card and the complete Study Group title, subject, date/time, room, and branch remain visible in every applicable message; invitation Accept/Deny actions remain prominent.

Automated checkpoint (2026-07-23): lifecycle-email regression passed 2 tests; full backend suite passed 102 tests with 1 opt-in performance test skipped; Node syntax validation passed for the mailer, Study Group model, and Study Group service.

Email-identity checkpoint (2026-07-23): invitation and lifecycle email regressions passed 8 tests. The four Study Group mail types now use distinct bilingual inbox prefixes and status-first banners while sharing one labelled group-detail table and the existing performer identity card.

Web-notification checkpoint (2026-07-23): targeted socket/browser regression passed; full backend suite passed 104 tests with 1 opt-in performance test skipped; touched client ESLint, TypeScript, locale JSON validation, server syntax validation, and Dashboard HTTP 200 passed. No SQL/schema file was modified.

Targeted-room correction (2026-07-23): JWTs are signed with `userId`; Socket.IO previously read the nonexistent `id` claim and joined every authenticated client to `user:undefined`, while global refresh events hid the mismatch. Socket authentication now requires and joins the canonical `userId`, and the regression suite asserts the claim/room alignment. The backend dev process reloaded the correction without restarting Next.js.

## Scenario 14: Study Together Member Visibility

1. Open a Study Together card for a group with one or more Approved participants besides the organizer.
2. Verify the existing detail popup shows a read-only Members section beneath Group Organizer with real avatars and initials fallback.
3. Verify no Remove, Invite, Approve, Deny, or Pending request information is available in Explore mode.
4. Open Group I Joined as Pending or Denied and verify its existing popup presentation does not begin rendering the member list.

## Scenario 15: Study Together Detail Route

1. Apply several Study Together filters, scroll the result grid, and select a card. Verify the existing detail modal opens and the URL becomes `/study-together/{groupId}` without a document reload, filter reset, list reload, or scroll jump.
2. Close the modal and verify the URL returns to `/study-together`. Reopen it, use browser Back, then Forward, and verify the modal closes and reopens while the list state remains intact.
3. Copy the detail URL into a new tab and reload it. Verify a localized loading state appears when needed and the persisted group detail opens even when that group is not present in the current discovery page.
4. Navigate to a valid-format nonexistent or no-longer-available group ID. Verify the page remains usable, presents the localized unavailable state, and returns to the Study Together list without a framework 404.
5. In Group I Created, apply status filters, change pagination if available, and open a card. Verify the URL becomes `/dashboard/user/yourstudygroups/created/{groupId}`, the Created management popup retains host actions, and Back/Forward preserves the underlying Dashboard state.
6. Repeat from Group I Joined and verify `/dashboard/user/yourstudygroups/joined/{groupId}` retains the Joined participation-specific actions and presentation.
7. Open both Dashboard detail URLs directly in new tabs. Verify the correct tab is selected, persisted detail loads even when outside the current page, and using a Created URL for a non-owned group or a Joined URL without participation produces the localized unavailable state rather than exposing the wrong popup.

## Scenario 15: Study Group Popup Profile Preview

1. Populate one creator with avatar, role, description, occupation, and hometown; leave another creator's optional profile fields blank.
2. Open Study Together, Group I Created, and Approved Group I Joined detail popups; hover the Group Organizer avatar/name and each Approved member avatar/name.
3. Repeat using keyboard Tab focus in light and dark modes.
4. Verify the preview does not resize or move the popup content and closes when hover/focus leaves. Verify outer Study Cards do not show the preview.
5. Inspect the Study Group response and preview content.

Expected: each trigger shows the same compact localized profile preview with initials fallback and six stable information positions: Email, Date of birth, Phone number, Gender, Occupation, and Hometown. Blank values show localized Unknown text. These extended fields are present in detail responses and absent from list/discovery responses.

## Scenario 16: Balanced Communication and Safe Navigation

1. Submit a normal join request. Verify the creator receives one email and one bell item whose CTA opens the Created detail popup and current request queue.
2. Approve it. Verify the requester receives one approved email/bell whose CTA opens the Joined detail popup, while the creator receives one distinct member-joined email/bell showing Members after the increment and opening the Created detail popup. Verify neither account receives a duplicate equivalent event.
3. Deny another request. Verify the requester email/bell routes to the general Your Study Groups page and communicates the authoritative cooldown.
4. Cancel a Pending request and decline a Pending invitation. Verify the creator receives bell-only cancellation/decline items opening the Created detail popup; no email is sent.
5. Edit group metadata once. Verify each Approved non-host member receives one bell-only update with changed-field labels and a Joined-detail CTA; the creator and Pending users receive none.
6. Open an invitation email link in a fresh browser without clicking an in-app decision. Verify it only opens the authorized invitation detail and does not mutate the request. Accept explicitly and verify the Joined detail opens; repeat with Deny and verify the general page opens.
7. Remove a member and dissolve a group. Verify the bilingual email CTA says View your Study Groups and routes to the general page. Verify stale/deleted direct-detail links expose the localized unavailable fallback rather than a framework 404.
8. Open an invitation email after its invitation has already been resolved or its Study Group has been dissolved. Verify the general Your Study Groups page shows the localized Invitation is no longer available dialog, distinct from the Study Group unavailable message used by stale Created/Joined detail links. Repeat by dissolving the group after the invitation popup opens but before Accept/Deny; the action must transition to the same invitation-specific unavailable dialog.
