# Tasks: Announcement & Notification Unification

**Inputs**:
*   [`src/specs/029-announcement-notification-unification/spec.md`](../../../src/specs/029-announcement-notification-unification/spec.md)
*   [`src/specs/029-announcement-notification-unification/plan.md`](../../../src/specs/029-announcement-notification-unification/plan.md)

---

## Format: `[ ] [ID] [P?] [Story] Description`
*   **[P]**: Can run in parallel (no files or step-level dependencies).
*   **[Story]**: Maps the task to a specific user story (US1, US2, US3).
*   **Completion Condition**: Identifies the specific artifact or validation that marks the task as complete.

---

### Phase 1 — Baseline verification

- [x] **T101** **[P]** **[US3]** **Confirm branch and working-tree state**:
  *   **File Path**: Project Root
  *   **Condition**: Run `git status` and `git branch` to confirm the project is in a clean baseline state.
- [x] **T102** **[P]** **[US2]** **Trace existing Announcement flow**:
  *   **File Path**: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts)
  *   **Condition**: Inspect client-side fetch, seen/unread, and socket subscription handlers on `HEAD` to verify the baseline announcement logic.
- [x] **T103** **[P]** **[US3]** **Trace existing Study Group flow**:
  *   **File Path**: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts)
  *   **Condition**: Verify how Study Group invitations are loaded and processed in the client hook compared to the backend endpoints.
- [x] **T104** **[P]** **[US3]** **Identify both bell render sites**:
  *   **File Path**: [`src/client/app/components/organisms/NavBar.tsx`](../../../src/client/app/components/organisms/NavBar.tsx) and [`src/client/app/components/molecules/AuthActions.tsx`](../../../src/client/app/components/molecules/AuthActions.tsx)
  *   **Condition**: Locate all render sites of `NotificationBell` in navigation headers on `HEAD`.
- [x] **T105** **[P]** **[US3]** **Confirm the final file-impact list**:
  *   **File Path**: [`src/specs/029-announcement-notification-unification/plan.md`](../../../src/specs/029-announcement-notification-unification/plan.md)
  *   **Condition**: Ensure the file list matches all targeted frontend/backend modules before beginning edits.
  *   **File Path**: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts) and [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
  *   **Condition**: Assert that types, API integrations, and room formatting are defined inline without creating new files.

---

### Phase 2 — US1 expiry validation

- [x] **T201** **[US1]** **Frontend input minimum**:
  *   **File Path**: [`src/client/app/components/molecules/AnnouncementForm.tsx`](../../../src/client/app/components/molecules/AnnouncementForm.tsx)
  *   **Condition**: Bind the `min` attribute of the date picker to the current local date in `YYYY-MM-DD` format.
- [x] **T202** **[US1]** **Frontend submit validation**:
  *   **File Path**: [`src/client/app/hooks/useAnnouncementManager.ts`](../../../src/client/app/hooks/useAnnouncementManager.ts)
  *   **Condition**: Refactor client submit validation in `handleSave` to block past dates for both draft and active announcements.
- [x] **T203** **[US1]** **Backend validation**:
  *   **File Path**: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
  *   **Condition**: Implement `validateExpiredDate` to compare the expiry date against today's local date string lexicographically in `YYYY-MM-DD` format.
- [x] **T204** **[US1]** **Create/update/activation integration**:
  *   **File Path**: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
  *   **Condition**: Integrate `validateExpiredDate` check unconditionally inside creation (`createAnnouncementService`) and detail edits (`editAnnouncementDetailsService`).
- [x] **T205** **[US1]** **Past/today/future/timezone tests**:
  *   **File Path**: `src/server/tests/services/announcement.services.spec.mjs`
  *   **Condition**: Add and pass Vitest tests verifying date boundary validation and timezone safety.

---

### Phase 3 — US2 republish

- [x] **T301** **[US2]** **Read previous persisted status**:
  *   **File Path**: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
  *   **Condition**: Retrieve the existing announcement from the database inside `updateAnnouncementStatusService` prior to executing updates.
- [x] **T302** **[US2]** **Detect non-active $\rightarrow$ active**:
  *   **File Path**: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
  *   **Condition**: Implement checks inside `updateAnnouncementStatusService` to flag when status changes from non-active (`draft`, `expired`) to `active`.
- [x] **T303** **[US2]** **Ensure active $\rightarrow$ active is not republish**:
  *   **File Path**: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
  *   **Condition**: Verify that editing details of active announcements (`active` $\rightarrow$ `active`) does not fire a republish event.
- [x] **T304** **[US2]** **Preserve UUID and `created_at`**:
  *   **File Path**: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
  *   **Condition**: Ensure status transitions only perform an `UPDATE` on the `status` column of the existing row, keeping all other columns unchanged.
- [x] **T305** **[US2]** **Emit one event after successful persistence**:
  *   **File Path**: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
  *   **Condition**: Broadcast exactly one Socket.IO event with `action = 'republished'` inside `updateAnnouncementStatusService` after successful DB write.
- [x] **T310** **[US2]** **Add relevant backend tests**:
  *   **File Path**: `src/server/tests/services/announcement.services.spec.mjs`
  *   **Condition**: Write Vitest tests covering status transition events and socket action emissions.
- [x] **T306** **[US2]** **Re-mark the item unread**:
  *   **File Path**: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts)
  *   **Condition**: In the socket event callback, remove the republished announcement's ID from the local seen list.
- [x] **T307** **[US2]** **Scope state by user**:
  *   **File Path**: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts)
  *   **Condition**: Scope client read storage lists under the authenticated user's ID (`amethyst:announcements:seenIds:${userId}`).
- [x] **T308** **[US2]** **Handle duplicate event delivery idempotently**:
  *   **File Path**: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts)
  *   **Condition**: Write to `localStorage` and React state ensuring duplicate socket payloads do not create multiple notifications.
- [x] **T309** **[US2]** **Clear unread state when viewed**:
  *   **File Path**: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts)
  *   **Condition**: Implement seen cleanup inside `markAsSeen` to append all loaded active announcement IDs to the local seen array upon dropdown open.

---

### Phase 4 — US3 unified bell

- [x] **T401** **[US3]** **Reuse existing Announcement output**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
  *   **Condition**: Ensure the announcement read view modal is mountable and launches when clicking announcement items.
- [x] **T402** **[US3]** **Reuse existing Study Group output**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
  *   **Condition**: Retain the exact modals, details cards, and banners used to view and decide invitations.
- [x] **T403** **[US3]** **Add minimal in-place discriminated union**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
  *   **Condition**: Implement `UnifiedNotificationItem` mapping functions to unify all three notification kind payloads.
- [x] **T404** **[US3]** **Merge and sort safely**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
  *   **Condition**: Merge lists and sort them chronologically by timestamp descending, with ID serving as a tie-breaker.
- [x] **T405** **[US3]** **Namespace React keys**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationDropdownPanel.tsx`](../../../src/client/app/components/molecules/NotificationDropdownPanel.tsx)
  *   **Condition**: Namespace React loop keys using the format `type + ':' + originalId` to prevent key collisions.
- [x] **T406** **[US3]** **Aggregate unread state**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
  *   **Condition**: Compute unified unread status on the bell icon: `hasUnreadAnnouncements || hasUnreadStudyGroupItems`.
- [x] **T407** **[US3]** **Use one dropdown**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationDropdownPanel.tsx`](../../../src/client/app/components/molecules/NotificationDropdownPanel.tsx)
  *   **Condition**: Combine all items into a single scrollable panel feed.
- [x] **T408** **[US3]** **Remove only the second bell render site**:
  *   **File Path**: [`src/client/app/components/molecules/AuthActions.tsx`](../../../src/client/app/components/molecules/AuthActions.tsx)
  *   **Condition**: Delete the redundant Study Group bell button, dropdown state, list mappings, and listeners from `AuthActions.tsx`.
- [x] **T409** **[US3]** **Preserve Study Group modal/actions/navigation**:
  *   **File Path**: [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
  *   **Condition**: Confirm invitation Accept/Deny decisions and system navigation routes complete successfully.
- [x] **T410** **[US3]** **Verify only one hook/listener owner is mounted**:
  *   **File Path**: [`src/client/app/components/organisms/NavBar.tsx`](../../../src/client/app/components/organisms/NavBar.tsx) and [`src/client/app/components/molecules/AuthActions.tsx`](../../../src/client/app/components/molecules/AuthActions.tsx)
  *   **Condition**: Assert that only one instance of `NotificationBell` is mounted at a time, resulting in a single active socket listener connection.

---

### Phase 5 — Automated verification

- [x] **T501** **[P]** **[US3]** **git diff --check**:
  *   **File Path**: Project Root
  *   **Condition**: Execute `git diff --check` to verify no whitespace errors exist.
- [x] **T502** **[P]** **[US3]** **Client lint**:
  *   **File Path**: [`src/client`](../../../src/client)
  *   **Condition**: Run `npm run lint` inside the client folder and verify it passes without warnings.
- [x] **T503** **[P]** **[US3]** **Client typecheck**:
  *   **File Path**: [`src/client`](../../../src/client)
  *   **Condition**: Run type check compiler commands (`npx tsc --noEmit`) to verify Type safety.
- [x] **T504** **[P]** **[US3]** **Client build**:
  *   **File Path**: [`src/client`](../../../src/client)
  *   **Condition**: Run `npm run build` and assert Next.js compiles successfully.
- [ ] **T505** **[P]** **[US3]** **Relevant frontend tests**:
  *   **File Path**: [`src/client`](../../../src/client)
  *   **Condition**: Assert that all React components mount and compile.
- [x] **T506** **[P]** **[US3]** **Relevant backend tests**:
  *   **File Path**: [`src/server`](../../../src/server)
  *   **Condition**: Execute `npm run test` (Vitest) and verify all suites pass successfully.

---

### Phase 6 — Manual scenarios

- [ ] **T601** **[US2]** **Republish restores dot**:
  *   **File Path**: Local Client Browser
  *   **Condition**: Open a read announcement (dot off), update status to draft then active, and confirm the dot immediately reappears on the bell.
- [ ] **T602** **[US2]** **Same UUID**:
  *   **File Path**: Local Client Browser / DB Tool
  *   **Condition**: Verify that the announcement's `announceId` UUID is identical before and after republishing.
- [ ] **T603** **[US2]** **Same `created_at`**:
  *   **File Path**: Local Client Browser / DB Tool
  *   **Condition**: Verify that the announcement's `createdAt` timestamp is identical before and after republishing.
- [ ] **T604** **[US2]** **Active $\rightarrow$ active produces no false event**:
  *   **File Path**: Local Client Browser
  *   **Condition**: Modify details of an active announcement, click save, and verify that the unread dot is not triggered.
- [ ] **T605** **[US3]** **One bell**:
  *   **File Path**: Local Client Browser
  *   **Condition**: Inspect the DOM of the home header and dashboard sidebar, confirming only a single bell icon is present.
- [ ] **T606** **[US3]** **Study Group accept/reject and lifecycle still work**:
  *   **File Path**: Local Client Browser
  *   **Condition**: Receive invitations, click Accept from the unified bell, and verify you are successfully added to the group.

---

### Phase 7 — Final scope audit

- [x] **T701** **[US3]** **No new Study Group type/API/room files**:
  *   **File Path**: [`src/client/app/types/`](../../../src/client/app/types/) and [`src/client/app/utils/`](../../../src/client/app/utils/)
  *   **Condition**: Confirm that no new study group helper modules are added.
- [x] **T702** **[US3]** **No backend Study Group changes**:
  *   **File Path**: [`src/server/src/controllers/`](../../../src/server/src/controllers/) and [`src/server/src/services/`](../../../src/server/src/services/)
  *   **Condition**: Confirm that no study group backend controllers or services have modified states.
- [x] **T703** **[US3]** **No mock-data changes**:
  *   **File Path**: [`src/client/app/study-together/mockData.ts`](../../../src/client/app/study-together/mockData.ts)
  *   **Condition**: Assert that the baseline mock study groups list remains unchanged.
- [x] **T704** **[US3]** **No package-lock changes**:
  *   **File Path**: `package.json` and `package-lock.json`
  *   **Condition**: Confirm that no packages or dependencies are added, updated, or deleted.
- [x] **T705** **[US3]** **No archive/binary**:
  *   **File Path**: Project Root
  *   **Condition**: Verify that no zip or temporary binaries exist.
- [x] **T706** **[US2]** **No schema migration**:
  *   **File Path**: [`src/database/`](../../../src/database/)
  *   **Condition**: Assert that no database migrations or schemas are created.
- [x] **T707** **[US2]** **No `published_at`**:
  *   **File Path**: [`src/server/src/models/announcement.models.mjs`](../../../src/server/src/models/announcement.models.mjs)
  *   **Condition**: Verify that no new database properties have been introduced.
- [x] **T708** **[US2]** **No `created_at` update**:
  *   **File Path**: [`src/server/src/models/announcement.models.mjs`](../../../src/server/src/models/announcement.models.mjs)
  *   **Condition**: Assert that `created_at` update queries are completely absent.
- [x] **T709** **[US3]** **No duplicate bell/listener/import/declaration**:
  *   **File Path**: Project Root
  *   **Condition**: Verify that duplicate bells, listeners, and unused imports are fully cleaned up.
- [x] **T710** **[US3]** **No unexplained Added source files**:
  *   **File Path**: Project Root
  *   **Condition**: Run `git status` to verify that only the expected files are modified.
