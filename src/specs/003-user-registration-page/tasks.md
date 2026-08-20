# Tasks: User Registration Page

**Input**: Design documents from `specs/003-user-registration-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: Manual UI verification as defined in `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create directory structure `client/app/register/` for the registration module
- [X] T002 Verify availability of reusable `InputField.js` and `OAuthButtons.js` in `client/app/login/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Implement `client/app/register/page.js` layout shell with warm cream background (`#FFF8EB`) and responsive Grid/Flexbox container
- [X] T004 [P] Create base `client/app/register/RegisterFormCard.js` with shared form state (name, email, role, password, isLoading, error)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Account Creation (Priority: P1) 🎯 MVP

**Goal**: Allow new users to create an account with name, email, role, and password.

**Independent Test**: Fill the registration form and click "Create Account"; verify mock loading state and success feedback.

### Implementation for User Story 1

- [X] T005 [P] [US1] Implement Full Name and Email Address fields in `client/app/register/RegisterFormCard.js` using `InputField` component
- [X] T006 [US1] Implement "Create Account" button and submission logic in `client/app/register/RegisterFormCard.js` (including mock loading state)
- [X] T007 [US1] Update `client/app/login/FormCard.js` to link "Create Account" button to `/register`
- [X] T008 [US1] Implement "Already have an account? Sign In" footer link in `client/app/register/RegisterFormCard.js` linking to `/login`

**Checkpoint**: At this point, basic registration flow is functional and accessible from the login page.

---

## Phase 4: User Story 2 - Role Selection (Priority: P2)

**Goal**: Enable users to choose between "Student/General" and "Librarian" roles.

**Independent Test**: Click between roles in the selector; verify active state styling changes (navy background for active).

### Implementation for User Story 2

- [X] T009 [P] [US2] Create `client/app/register/RoleSelector.js` with ARIA tablist roles and interactive styling per `ui-contract.md`
- [X] T010 [US2] Integrate `RoleSelector` into `client/app/register/RegisterFormCard.js` and connect to form state

**Checkpoint**: Users can now select their role during registration.

---

## Phase 5: User Story 3 - Password Security Feedback (Priority: P2)

**Goal**: Provide visual feedback on password strength using a 4-bar indicator.

**Independent Test**: Type a password and verify the 4-bar indicator updates based on complexity (length, numbers, case, symbols).

### Implementation for User Story 3

- [X] T011 [P] [US3] Create `client/app/register/SecurityIndicator.js` with 4 rounded bars and "Security Level" caption
- [X] T012 [US3] Implement password strength calculation logic (0-4) in `client/app/register/RegisterFormCard.js` per `research.md`
- [X] T013 [US3] Integrate `SecurityIndicator` into `client/app/register/RegisterFormCard.js` below the password field

**Checkpoint**: Password field now provides real-time security feedback.

---

## Phase 6: User Story 4 - OAuth Integration (Priority: P3)

**Goal**: Allow users to sign up using their Google account.

**Independent Test**: Click "Sign up with Google" and verify mock OAuth flow initiation.

### Implementation for User Story 4

- [X] T014 [P] [US4] Integrate `OAuthButtons.js` into `client/app/register/RegisterFormCard.js` with "Sign up with Google" label

**Checkpoint**: All registration methods (form and OAuth) are now available.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final styling, responsiveness, and validation.

- [X] T015 [P] Finalize all design tokens (colors, fonts, spacing) across all components to match `signup_design.txt`
- [X] T016 [P] Perform responsiveness audit on mobile, tablet, and desktop breakpoints
- [X] T017 Run `quickstart.md` validation scenarios and fix any identified issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on T001, T002. BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - US1 (P1) is the MVP and should be completed first.
  - US2, US3, and US4 can proceed in parallel once Phase 2 is done.

### Parallel Opportunities

- T003 and T004 (Foundational) can run in parallel.
- T005 [US1], T009 [US2], T011 [US3], and T014 [US4] can start in parallel as they create independent sub-components.
- Polish tasks (T015, T016) can run in parallel once implementation is largely complete.

---

## Parallel Example: User Story 3

```bash
# Implement the visual component independently of the logic:
Task: "Create client/app/register/SecurityIndicator.js with 4 rounded bars"

# Meanwhile, implement the logic in the form card:
Task: "Implement password strength calculation logic in client/app/register/RegisterFormCard.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup & Foundation (T001 - T004).
2. Complete Account Creation (US1: T005 - T008).
3. **VALIDATE**: Ensure a basic user can navigate from Login to Register and see the form.

### Incremental Delivery

1. Add Role Selection (US2) -> Validate tab switching.
2. Add Password Strength (US3) -> Validate real-time feedback.
3. Add Google OAuth (US4) -> Finalize entry points.
4. Polish and Final Audit.
