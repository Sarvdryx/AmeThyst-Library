# Tasks: Auth JS Refactor

**Input**: Design documents from `specs/002-auth-js-refactor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `src/client/app/login/` directory
- [X] T002 [P] Verify Tailwind CSS configuration in `tailwind.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create base shell for `src/client/app/login/page.js` with `"use client"` directive

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Successful Login Layout (Priority: P1) 🎯 MVP

**Goal**: Deliver a responsive login page layout with core UI components.

**Independent Test**: Navigate to `/login` and verify that `BrandPanel`, `InputField`, `OAuthButtons`, and `FormCard` are correctly displayed and responsive.

### Implementation for User Story 1

- [X] T004 [P] [US1] Implement `src/client/app/login/BrandPanel.js` with LIMA logo and background
- [X] T005 [P] [US1] Implement base `src/client/app/login/InputField.js` per `ui-contract.md`
- [X] T006 [P] [US1] Implement `src/client/app/login/OAuthButtons.js` with Google icon alignment
- [X] T007 [US1] Implement `src/client/app/login/FormCard.js` using `InputField` and `OAuthButtons`
- [X] T008 [US1] Integrate `BrandPanel` and `FormCard` into `src/client/app/login/page.js` using responsive Flexbox/Grid

**Checkpoint**: User Story 1 (Layout MVP) is functional and testable independently.

---

## Phase 4: User Story 2 - Interactive Mocking (Priority: P2)

**Goal**: Allow developers to toggle mock UI states (Loading, Error) for verification.

**Independent Test**: Use the floating `StateMockConsole` to toggle loading and error states; verify UI updates correctly.

### Implementation for User Story 2

- [X] T009 [P] [US2] Implement `src/client/app/login/StateMockConsole.js` with toggle buttons
- [X] T010 [US2] Setup `useState` for `isLoading` and `error` in `src/client/app/login/page.js`
- [X] T011 [US2] Connect `StateMockConsole` to state in `src/client/app/login/page.js`
- [X] T012 [US2] Implement conditional error banner in `src/client/app/login/page.js`
- [X] T013 [US2] Update `src/client/app/login/FormCard.js` to show loading spinner in button when `isLoading` is true

**Checkpoint**: User Stories 1 and 2 are functional and testable independently.

---

## Phase 5: User Story 3 - Input Validation (Priority: P3)

**Goal**: Provide visual feedback for input validation errors.

**Independent Test**: Toggle "Show Validation" in the mock console and verify that error messages appear below input fields.

### Implementation for User Story 3

- [X] T014 [US3] Add `validationErrors` state to `src/client/app/login/page.js`
- [X] T015 [US3] Update `src/client/app/login/InputField.js` to display error messages and red border
- [X] T016 [US3] Update `src/client/app/login/FormCard.js` to pass validation error props to inputs
- [X] T017 [US3] Add "Show Validation" toggle logic to `src/client/app/login/StateMockConsole.js`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and styling adjustments.

- [X] T018 [P] Verify responsive behavior (no absolute positioning) in `src/client/app/login/*.js` across mobile and desktop
- [X] T019 Run full validation suite defined in `specs/002-auth-js-refactor/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **User Stories (Phase 3-5)**: All depend on Phase 2.
- **Polish (Phase 6)**: Depends on Phase 3-5.

### Parallel Opportunities

- T004, T005, T006 [US1] can be developed in parallel.
- T009 [US2] can be developed in parallel with other US2/US1 tasks.
- US1, US2, and US3 can proceed in parallel once the `page.js` shell and state structure are established.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup + Foundational.
2. Complete User Story 1 (Layout).
3. **VALIDATE**: Ensure `/login` renders correctly on mobile/desktop.

### Incremental Delivery

1. Add User Story 2 (Mocking) to allow visual testing of states.
2. Add User Story 3 (Validation) to complete the interactive UI.
