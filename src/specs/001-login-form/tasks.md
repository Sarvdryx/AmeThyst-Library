# Tasks: login-form

**Input**: Design documents from `/specs/001-login-form/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The component will be verified visually using the mock state controls as defined in the spec. Automated tests are not requested for this phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create component directory at `client/app/library/components/`
- [X] T002 [P] Verify `Inter` and `Inder` font variables are active in `client/app/layout.js`
- [X] T003 [P] Verify Tailwind CSS configuration in `client/tailwind.config.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `LoginForm.tsx` shell with `"use client"` directive in `client/app/library/components/LoginForm.tsx`
- [X] T005 Implement `LoginFormState` and `Credentials` interfaces in `client/app/library/components/LoginForm.tsx`
- [X] T006 [P] Define `LoginForm` component structure with outer container and warm cream background (`#FFF8EB`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure and Responsive Login Interface (Priority: P1) 🎯 MVP

**Goal**: Implement the core split-screen login layout with a mobile-first responsive design.

**Independent Test**: Open the page on desktop (>=1024px) to see the split-screen with "LIMA" branding. Resize to <1024px to see the branding hide and form center.

### Implementation for User Story 1

- [X] T007 [US1] Implement the left branding panel with "LIMA" text and linear overlay in `client/app/library/components/LoginForm.tsx`
- [X] T008 [US1] Implement the responsive visibility classes to hide branding panel at `lg` breakpoint (<1024px)
- [X] T009 [US1] Implement the right form container with max-width `max-w-[342px]` and centering logic
- [X] T010 [P] [US1] Create the "Email Address" input field with styling and Inter font in `client/app/library/components/LoginForm.tsx`
- [X] T011 [P] [US1] Create the "Password" input field with "Forgot Password?" link and Inder font header
- [X] T012 [US1] Implement the primary "Sign In" button with deep navy background (`#091426`)
- [X] T013 [US1] Implement the "Sign in with Google" button with SVG icons and teal accent (`#006A61`)
- [X] T014 [US1] Add the "Create Account" footer link and button

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Interactive Form Feedback (Priority: P2)

**Goal**: Implement mock interactive states (loading, error, validation) toggled by a floating panel.

**Independent Test**: Use the floating buttons on the right edge of the screen to toggle loading spinners and error banners.

### Implementation for User Story 2

- [X] T015 [US2] Implement local `useState` hooks for `isLoading`, `error`, and `validationErrors` in `client/app/library/components/LoginForm.tsx`
- [X] T016 [US2] Create the fixed floating vertical button group on the right screen edge for mock controls
- [X] T017 [US2] Implement the "Toggle Loading" mock button and corresponding spinner UI on the "Sign In" button
- [X] T018 [US2] Implement the "Simulate Wrong Password" mock button and top-level error banner UI
- [X] T019 [US2] Implement the "Show Validation" mock button and inline error messages for inputs
- [X] T020 [US2] Implement the "Clear States" mock button to reset all UI states to idle

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T021 [P] Fine-tune spacing and transitions to match `auth_design.txt` exactly
- [X] T022 [P] Verify accessibility (aria-labels, focus states) on all inputs and buttons
- [X] T023 Run `quickstart.md` validation scenarios to ensure 100% compliance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phase 3 & 4)**: Depend on Phase 2. US1 is the highest priority (P1).
- **Polish (Phase 5)**: Depends on US1 and US2 completion.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.
- **User Story 2 (P2)**: Depends on the visual components of US1 existing to apply states to them.

### Parallel Opportunities

- T002 and T003 (Setup)
- T010 and T011 (Inputs in US1)
- T021 and T022 (Polish)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (US1).
3. **VALIDATE**: Ensure the layout is perfectly responsive and visually accurate.

### Incremental Delivery

1. Add US2 mock interactivity.
2. Final polish and validation against `quickstart.md`.
