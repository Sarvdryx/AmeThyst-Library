---
description: "Task list for Librarian Announcements Dashboard"
---

# Tasks: Librarian Announcements Dashboard

**Input**: Design documents from `/specs/023-libarian-announcements/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure and layout requirements for the dashboard page

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Setup localization keys for English in src/client/app/locales/en.json
- [x] T003 [P] Setup localization keys for Vietnamese in src/client/app/locales/vi.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Announcements List (Priority: P1) 🎯 MVP

**Goal**: As a librarian, I want to see a list of all announcements (active, draft, expired) so that I can manage library communications.

**Independent Test**: Can be tested by verifying the list renders correctly with mock data, showing proper status badges and dates.

### Implementation for User Story 1

- [x] T004 [P] [US1] Implement mock data and basic structural layout in src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx
- [x] T005 [US1] Implement the left-side Announcements List UI (statuses, dates, titles) in src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx
- [x] T006 [P] [US1] Create the page route and integrate the panel in src/client/app/dashboard/librarian/announcements/page.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. You should be able to navigate to the new page and see the list.

---

## Phase 4: User Story 2 - Create/Edit Announcement (Priority: P1)

**Goal**: As a librarian, I want to create new announcements or edit existing ones using an editor panel, so I can communicate important updates to library users.

**Independent Test**: Can be tested by filling out the editor form and clicking action buttons (Save Draft, Publish Now).

### Implementation for User Story 2

- [x] T007 [US2] Implement the right-side Announcement Editor UI in src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx
- [x] T008 [US2] Add interactive state management (selecting list items, updating mock state on save/publish) in src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. The complete panel is interactive.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T009 Verify dark mode and responsive design across src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx
- [x] T010 Code cleanup and checking for hardcoded texts/colors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (US1 → US2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Integrates with US1's state (list selection), so should be implemented after the basic panel is set up.

### Parallel Opportunities

- T002 and T003 can be executed in parallel (localization updates).
- T004 and T006 can be executed in parallel (creating the component skeleton and the page route).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently by viewing the list in the browser.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Editor becomes interactive
4. Each story adds value without breaking previous stories
