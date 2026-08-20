---
description: "Task list template for feature implementation"
---

# Tasks: User Dashboard - Your Study Groups

**Input**: Design documents from `/specs/014-user-dashboard-studygroup/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize page routing for the dashboard at `client/app/dashboard/user/yourstudygroups/page.tsx`
- [x] T002 Update `client/app/study-together/mockData.ts` to support new user-specific statuses for groups (e.g., upcoming, cancelled, inprogress, completed, expired) and applicant statuses (pending, approved, denied, expired)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Refactor `client/app/components/molecules/StudyGroupCard.tsx` interface to accept a `viewMode` prop (e.g., 'explore', 'joined', 'created') to handle conditional rendering logic without breaking existing pages.
- [x] T004 Refactor `client/app/components/organisms/StudyGroupInfoModal.tsx` interface to accept `viewMode` and support new conditional sections.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Joined Study Groups (Priority: P1) 🎯 MVP

**Goal**: As a user, I want to view a list of study groups I have joined in my dashboard.

**Independent Test**: Navigate to `/dashboard/user/yourstudygroups` and verify the "Group I Joined" section displays the correct cards and popups.

### Implementation for User Story 1

- [x] T005 [P] [US1] Update `client/app/components/molecules/StudyGroupCard.tsx` to support 'joined' mode: add status tags (pending, approved, denied, expired) next to the subject tag, and hide the JOIN GROUP/FULL buttons.
- [x] T006 [P] [US1] Update `client/app/components/organisms/StudyGroupInfoModal.tsx` to support 'joined' mode: add a "Cancel Request" button if the group status is pending.
- [x] T007 [US1] Implement "Group I Joined" section in `client/app/dashboard/user/yourstudygroups/page.tsx` rendering `StudyGroupCard` mapped to the joined mock data.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - View Created Study Groups (Priority: P1)

**Goal**: As a user, I want to view a list of study groups I have created so that I can manage or review them.

**Independent Test**: Navigate to `/dashboard/user/yourstudygroups` and verify the "Group I Created" section displays cards and management popups.

### Implementation for User Story 2

- [x] T008 [P] [US2] Update `client/app/components/molecules/StudyGroupCard.tsx` to support 'created' mode: add status tags (upcoming, full, cancelled, inprogress, completed, expired) and a "pending applicants" notification layout as specified in the .txt.
- [x] T009 [P] [US2] Update `client/app/components/organisms/StudyGroupInfoModal.tsx` to support 'created' mode: add management buttons (Approve/Deny, Dissolve group, Invite member, Edit) based on the original `group-more-info-layout.txt`.
- [x] T010 [US2] Implement "Group I Created" section in `client/app/dashboard/user/yourstudygroups/page.tsx` rendering `StudyGroupCard` mapped to the created mock data.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T011 Update localization keys in `client/app/locales/en.json` and `vi.json` for all new status tags and management buttons.
- [ ] T012 Verify responsive layout and Tailwind Dark Mode compatibility on the new dashboard page.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- Updates to `StudyGroupCard.tsx` and `StudyGroupInfoModal.tsx` logic can often be parallelized once the interface changes are agreed upon.
- Different user stories (Joined vs Created) can be worked on in parallel by separating the mock data slices in `page.tsx`.
