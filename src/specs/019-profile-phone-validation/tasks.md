# Tasks: Profile Phone Number Validation

**Input**: Design documents from `/specs/019-profile-phone-validation/`

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

- [ ] T002 Add translation key for `profile.phone_validation_error` to `src/client/app/locales/en.json` and `src/client/app/locales/vi.json`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Phone Number Validation on Save (Priority: P1) 🎯 MVP

**Goal**: Implement validation checks on Save Changes click and display inline error below the phone field.

**Independent Test**: Edit phone number to be invalid and click Save Changes; verify inline error renders and API call is blocked. Clear it or Cancel and verify error goes away.

### Implementation for User Story 1

- [ ] T003 Add `phoneError` state in `src/client/app/profile/page.tsx`
- [ ] T004 Update `handleLocalUpdate(field, value)` in `src/client/app/profile/page.tsx` to clear `phoneError` when `field === 'phoneNumber'` is updated
- [ ] T005 Update `handleCancel` in `src/client/app/profile/page.tsx` to clear `phoneError`
- [ ] T006 Implement regex validation `/^\d{9,10}$/` inside `handleSaveChanges` in `src/client/app/profile/page.tsx` for the phone field; set `phoneError` and abort save if validation fails
- [ ] T007 Wrap the phone `ProfileCard` in a container in `src/client/app/profile/page.tsx` and render the error message inline below the card

**Checkpoint**: Client-side validation blocks invalid submits and displays error messages correctly.

---

## Phase 4: User Story 2 - Localization of Validation Feedback (Priority: P2)

**Goal**: Localize validation messages using i18n.

**Independent Test**: Switch languages when the error is visible and verify translation.

### Implementation for User Story 2

- [ ] T008 Render the error text using the `t('profile.phone_validation_error')` key and style with Tailwind `text-red-600 dark:text-red-400` classes

**Checkpoint**: Inline validation errors are fully styled and localized.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification and compilation checks

- [ ] T009 Run TypeScript compiler check (`npx tsc --noEmit`) to verify clean build
