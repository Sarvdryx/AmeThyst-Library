---
description: "Task list for Announcement Notification Bell & is_pinned Removal"
---

# Tasks: Announcement Notification Bell & is_pinned Removal

**Input**: Design documents from `/specs/025-announcement-notification-bell/`

**Prerequisites**: plan.md (required), research.md (required), data-model.md (required)

**Organization**: Tasks are grouped by logical workstreams to enable independent implementation, testing, and easy rollback of each feature.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirming baseline implementation without performing modifications.

- [x] T001 Audit and confirm all occurrences of `is_pinned` and `isPinned` across database scripts, backend API controllers/services/models, and client panels.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and localized assets that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T002 Create a database migration script [src/database/migrations/drop_is_pinned.sql](file:///D:/HK3/Library/AmeThyst-Library/src/database/migrations/drop_is_pinned.sql) to drop the `is_pinned` column.
- [x] T003 Update the initialization script [src/database/init_db/postgres/05_init_rest.sql](file:///D:/HK3/Library/AmeThyst-Library/src/database/init_db/postgres/05_init_rest.sql) to remove the `is_pinned` column.
- [x] T004 [P] Update English i18n keys in [src/client/app/locales/en.json](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/locales/en.json) (remove `pin_to_homepage`, add `announcements_title` and `no_new_announcements` keys).
- [x] T005 [P] Update Vietnamese i18n keys in [src/client/app/locales/vi.json](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/locales/vi.json) (remove `pin_to_homepage`, add `announcements_title` and `no_new_announcements` keys).

**Checkpoint**: Foundation ready - database schemas and localized assets are prepared.

---

## Phase 3: User Story A - Remove is_pinned End-to-End (Priority: P1)

**Goal**: As a system administrator/librarian, I want the system to be completely decoupled from the "Pin to Homepage" feature so that layout and database structure are simplified.

**Independent Test**: Creating or editing an announcement from the librarian dashboard no longer sends or displays any pin-related field, and existing announcements load correctly.

### Implementation for User Story A

- [x] T006 Remove `is_pinned`/`isPinned` from backend model functions in [src/server/src/models/announcement.models.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/models/announcement.models.mjs).
- [x] T007 Remove `isPinned` properties from service functions in [src/server/src/services/announcement.services.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/services/announcement.services.mjs).
- [x] T008 Remove `is_pinned` mapping in request controllers in [src/server/src/controllers/announcement.controllers.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/controllers/announcement.controllers.mjs).
- [x] T009 Update the `Announcement` model type in [src/client/app/components/molecules/AnnouncementListItem.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AnnouncementListItem.tsx) to drop `isPinned`.
- [x] T010 Remove the ToggleSwitch, form states, and save payload fields in [src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx).

**Checkpoint**: At this point, User Story A is fully functional. Announcements can be managed without pinning logic.

---

## Phase 4: User Story B - Notification Bell Dropdown (Priority: P1)

**Goal**: As a library user, I want to access a dropdown panel listing active announcements by clicking the bell icon on the NavBar, so I can stay up to date without moving to a different page.

**Independent Test**: Clicking the bell while logged in fetches active announcements from `/api/announcements` and displays them, closing correctly when clicking outside.

### Implementation for User Story B

- [x] T011 Set up state variables (isOpen, loading, announcements, expandedId) and reference ref, refactored into the `NotificationBell.tsx` component and `useAnnouncementBell.ts` hook.
- [x] T012 Implement the click-outside mousedown listener pattern in the `NotificationBell.tsx` component.
- [x] T013 Integrate the API fetch hook using `apiFetch` to fetch public active announcements in `useAnnouncementBell.ts`.
- [x] T014 Design and build the dropdown UI, adding loading skeletons, an empty state, layout truncation, inline detail toggles, and notification dot indicators, refactored into `NotificationDropdownPanel.tsx`, `AnnouncementNotificationItem.tsx`, `BellIcon.tsx`, and `NotificationDot.tsx`.

**Checkpoint**: At this point, User Story B is fully functional. The notification bell is wired up and live.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verifying aesthetics, responsiveness, and completeness across modules.

- [x] T015 Perform dark/light mode visual pass for the notification dropdown, ensuring LIMA theme tokens are used.
- [x] T016 Check responsiveness of the dropdown overlay on mobile and tablet viewport widths.
- [x] T017 Run a final codebase search to ensure zero stray occurrences of `isPinned` or `is_pinned` remain in application controllers.

---

## Phase 6: Workstream C - Bell Dropdown Refinement & Custom Themes

**Purpose**: Refactor inline dropdown markup from AuthActions into atomic structures, implement light/dark mode LIMA theme tokens, and add client-side read tracking via localStorage.

### (1) Hook Creation
- [x] T018 Define the client-side hook `useAnnouncementBell` in [useAnnouncementBell.ts](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/hooks/useAnnouncementBell.ts) that handles active announcement fetching via `apiFetch` and client-side unread tracking via browser `localStorage`.

### (2) Atomic Decomposition
- [x] T019 Create the atoms `BellIcon` and `NotificationDot` under [components/atoms](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/atoms) and register them in [atoms/index.ts](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/atoms/index.ts).
- [x] T020 Create the molecules `AnnouncementNotificationItem`, `NotificationDropdownPanel`, and `NotificationBell` under [components/molecules](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules) and register them in [molecules/index.ts](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/index.ts).
- [x] T021 Refactor the notification bell markup and state toggle in [AuthActions.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AuthActions.tsx) to render the new `NotificationBell` molecule component.

### (3) Theme Token Replacement
- [x] T022 Replace hard-coded background (`bg-[#000]`) and text colors (`text-white`) in `NotificationDropdownPanel` with LIMA theme tokens (`bg-background` and `text-foreground`).
- [x] T023 Replace text colors for date (`text-neutral-500`) and body (`text-neutral-400`) in `AnnouncementNotificationItem` with LIMA theme tokens (`text-foreground/50` and `text-foreground/70`).
- [x] T024 Replace hardcoded border colors (`border-neutral-700`) with LIMA theme borders (`border-foreground/10`).
- [x] T025 Replace amber and black colors on the count badge (`bg-amber-500`, `text-[#000]`) with LIMA theme tokens (`bg-orange`, `text-navy`).
- [x] T026 Align bell toggle button color to always remain visible on the black navbar (`text-white hover:text-orange`) and style the dot ring to blend (`ring-black dark:ring-neutral-950`).

### (4) Unread-State Wiring
- [x] T027 Retrieve `lastSeenId` from `localStorage` using SSR-safe checks in `useAnnouncementBell`.
- [x] T028 Track and toggle unread status `hasUnread` by comparing the newest announcement ID against `lastSeenId`.
- [x] T029 Bind the dropdown opening action to trigger `markAsSeen()`, updating the stored `lastSeenId` to the newest announcement ID and clearing the unread dot.

### (5) Manual QA & Verification
- [x] T030 Verify the dropdown panel's theme compliance by toggling Light/Dark mode and confirming it shifts between `#F8EFE6` (light background) and `#091426` (dark background).
- [x] T031 Test locale translations in the dropdown title and empty state under English (`en`) and Vietnamese (`vi`) locales.
- [x] T032 Test mobile and tablet responsiveness to ensure the dropdown overlays correctly and does not overflow.
- [x] T033 Verify first-visit behavior when `localStorage` is empty: check that the notification dot displays initially when active announcements exist, disappears on click, and does not reappear on page refresh.

---

## Phase 7: Workstream D - Full Announcement Reading View (Priority: P1)

**Purpose**: Implement a centered news-article style overlay modal that opens when clicking an announcement from the dropdown, stays in page context, and supports responsive theme styling.

- [x] T034 Create `AnnouncementReadingModal.tsx` under [components/organisms](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms) (or similar directory) using standard React portals or overlays.
- [x] T035 Implement body scroll-locking hook or effect within the modal to prevent page double-scrolling when open.
- [x] T036 Update dropdown click handlers in `NotificationBell` / `AnnouncementNotificationItem` to close the dropdown and set the selected announcement to open in the reading modal.
- [x] T037 Apply news article styling: large headline, publish date / expiry meta byline, readable max-width columns, `leading-relaxed` leading, and preserve line breaks with `whitespace-pre-line`.
- [x] T038 Style the close controls (top-right X button, backdrop backdrop-blur overlay, and Escape key binding).
- [x] T039 Implement LIMA styling using theme tokens (`bg-background`, `text-foreground`, and border overlays) for full dark/light mode compatibility.
- [x] T040 Verify clicking dropdown item closes panel and opens modal overlay, test scroll lock, and ensure correct display in both dark and light modes.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Independent - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phases 3 and 4)**: Depended on Phase 2. Since A and B are logically decoupled, their implementation blocks can proceed in parallel.
- **Polish (Phase 5)**: Depends on completion of User Stories A and B.
- **Dropdown Refinement (Phase 6)**: Refactors the dropdown and hook.
- **Reading View Overlay (Phase 7)**: Depends on Phase 6 dropdown component architecture and backend data fetching logic.

### Parallel Opportunities
- T004 and T005 can be executed in parallel (translation changes).
- Phase 3 (User Story A) and Phase 4 (User Story B) can be developed concurrently.

---

## Phase 8: Workstream E - Real-time Delivery via Socket.IO

**Goal**: Implement real-time announcement updates via Socket.IO so users see unread status changes instantly.

- [x] T041 Fix decoded.id -> decoded.userId in socket.mjs first; this is a prerequisite bug fix everything else in this phase depends on.
- [x] T042 Wire Socket.IO emit in `createAnnouncementService` (action: `'created'`).
- [x] T043 Wire Socket.IO emit in `editAnnouncementDetailsService` (action: `'updated'`).
- [x] T044 Wire Socket.IO emit in `updateAnnouncementStatusService` (action: `'status_changed'`).
- [x] T045 Wire Socket.IO emit in `deleteAnnouncementService` (action: `'deleted'`).
- [x] T046 Wire Socket.IO emit in `expireOutdatedAnnouncementsService` (action: `'status_changed'`).
- [x] T047 Integrate/verify periodic/startup cleanup emits in `announcementScheduler.mjs`.
- [x] T048 Write unit tests for announcement service emits, mocking getIO(), following the exact mocking pattern in register.service.spec.mjs.
- [x] T049 In `useAnnouncementBell.ts`, obtain the auth token via `getAuthToken()` from `utils/user`.
- [x] T050 In `useAnnouncementBell.ts`, connect to socket and subscribe to `announcement:changed` inside useEffect.
- [x] T051 In `useAnnouncementBell.ts`, implement proper `socket.off('announcement:changed')` cleanup in the useEffect return.
- [x] T052 Verify Socket.IO server authentication on client connection.
- [x] T053 Verify real-time unread dot updates on announcement creation/edit.
- [x] T054 Verify real-time updates on announcement status change or deletion.
- [x] T055 Verify real-time updates on automated scheduler expiry.
- [x] T056 Re-run the full backend test suite (`npx vitest run`) and verify all tests pass.

