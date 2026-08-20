# Tasks: Page Level Profile Save Changes

**Input**: Design documents from `/specs/018-page-level-profile-save/`

**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify active feature specs directory and environment setup

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T002 Add translation keys for `profile.save_changes` and `profile.cancel` to `src/client/app/locales/en.json` and `src/client/app/locales/vi.json`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Page-Level Profile Updates (Priority: P1) 🎯 MVP

**Goal**: Implement the page-level Save Changes and Cancel buttons, comparing editing state against original loaded values and saving in a single API call.

**Independent Test**: Edit a profile field and confirm the card update. Verify page-level Cancel button restores the original value. Verify page-level Save Changes button updates all modified fields at once in a single backend PUT request.

### Implementation for User Story 1

- [ ] T003 Add `originalProfile` state in `src/client/app/profile/page.tsx` and initialize it upon successful load from the API
- [ ] T004 Implement `handleLocalUpdate(field, value)` in `src/client/app/profile/page.tsx` to update the `profile` state locally
- [ ] T005 Update `ProfileCard` props in `src/client/app/profile/page.tsx` to pass the local update handler to `onUpdate`
- [ ] T006 Add a Cancel button and Save Changes button in a flex container at the bottom right of `src/client/app/profile/page.tsx` (below the grid layout)
- [ ] T007 Implement the disabled condition for the Save Changes button based on comparison between `profile` and `originalProfile`
- [ ] T008 Implement the click handler for the Cancel button to reset the `profile` state to `originalProfile`
- [ ] T009 Implement the click handler for the Save Changes button to collect modified fields, send a single PUT request to the backend API, update `originalProfile` on success, and update localStorage details
- [ ] T010 Verify `src/client/app/components/molecules/ProfileCard.tsx`'s click-to-save behavior only updates the parent React state through `onUpdate` without triggering any API request

**Checkpoint**: Page-level Save and Cancel actions are fully functional.

---

## Phase 4: User Story 2 - Localization and Theme Support (Priority: P2)

**Goal**: Style the page-level buttons using dark-mode Tailwind classes and use translation hook keys.

**Independent Test**: Verify language toggle and dark/light mode transition on the new buttons.

### Implementation for User Story 2

- [ ] T011 Style the page-level buttons using Tailwind dark-mode classes (no hardcoded colors) and map labels using `t('profile.save_changes')` and `t('profile.cancel')`

**Checkpoint**: Buttons are styled and localized.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T012 Run TypeScript checks to verify project compilation (`npx tsc --noEmit`)
