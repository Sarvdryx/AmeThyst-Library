# Tasks: Password Input Toggle Component

**Input**: Design documents from `/specs/015-password-input-toggle/`

**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify active feature specs directory and environment setup

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T002 Create `src/client/app/components/atoms/PasswordInput.tsx` to wrap the `Input` atom, containing label, inline SVGs, toggle button, and error display logic
- [X] T003 [P] Export the `PasswordInput` component in `src/client/app/components/atoms/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Show/Hide Password Toggle (Priority: P1) 🎯 MVP

**Goal**: Implement the password visibility toggle functionality within the input atom.

**Independent Test**: Use the toggle button on any form and verify that clicking it toggles visibility status and switches the icons dynamically.

### Implementation for User Story 1

- [X] T004 Implement toggle button state using `useState` in `src/client/app/components/atoms/PasswordInput.tsx`
- [X] T005 Add inline SVGs (eye and crossed eye icons) and toggle functionality using `type="button"` in `src/client/app/components/atoms/PasswordInput.tsx`

**Checkpoint**: At this point, the PasswordInput component is fully functional.

---

## Phase 4: User Story 2 - Uniform Form Passwords Toggling (Priority: P2)

**Goal**: Integrate the show/hide password toggle into all relevant password forms.

**Independent Test**: Navigate to the register, login, forgot-password, and profile settings forms, verify that all password inputs now use the new component and work properly.

### Implementation for User Story 2

- [X] T006 [P] Replace the password field in `src/client/app/components/organisms/LoginFormCard.tsx` with the new `<PasswordInput ... />` component
- [X] T007 [P] Replace the password and confirm password fields in `src/client/app/components/organisms/RegisterFormCard.tsx` with `<PasswordInput ... />`
- [X] T008 [P] Replace the current, new, and confirm password fields in `src/client/app/components/organisms/SecurityFormCard.tsx` with `<PasswordInput ... />`
- [X] T009 [P] Replace the new and confirm password fields in `src/client/app/components/organisms/ForgotPasswordCard.tsx` with `<PasswordInput ... />`

**Checkpoint**: All password fields across forms are updated and function correctly.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T010 Verify proper padding right in input so that text doesn't overlap the toggle button
- [X] T011 Run TypeScript checks to verify project compilation (`npx tsc --noEmit`)
