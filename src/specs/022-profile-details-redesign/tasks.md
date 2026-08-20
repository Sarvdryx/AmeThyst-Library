# Tasks: Profile Details Redesign & Borrowing Info Widget

**Input**: Design documents and feature specifications from `specs/022-profile-details-redesign/`

**Prerequisites**: `spec.md` (required for user stories), `plan.md` (required for architecture), `research.md`, `data-model.md`, `contracts/api.md`

## Format: `[ID] [P?] [Story/Phase] Description`

- **[P]**: Can run in parallel (affects separate files, has no dependencies).
- **[Story/Phase]**: Identifies the focus area (e.g., US1, US2, US3, Setup, Backend).
- Exact file paths are provided for each task.

---

## Phase 1: Setup & Localization (Foundational)

**Goal**: Prepare the UI localization resources and create the shared `ProfileSectionCard` molecule.

- [ ] T001 [P] [Setup] **Update i18n Dictionaries**:
  Add translation keys for the new profile fields (`occupation`, `birth_date`, `gender`, `hometown`, `description`) and borrowing information widget labels to `src/client/app/locales/en.json` and `src/client/app/locales/vi.json`.
- [ ] T002 [P] [Setup] **Create Reusable `ProfileSectionCard` Molecule**:
  Create the custom molecule `src/client/app/components/molecules/ProfileSectionCard.tsx` based on the Figma card design (encapsulating borders, shadow, padding, title styling, and dark mode tokens) using a responsive layout instead of absolute positions. Export the card inside `src/client/app/components/molecules/index.ts`.

---

## Phase 2: Backend Services (Foundational)

**Goal**: Extend the database SELECT/UPDATE bindings, perform validations, and expose system constraints.

- [ ] T003 [P] [Backend] **Export MAX_BORROW_LIMIT constant**:
  Change `const MAX_BORROW_LIMIT` in `src/server/src/services/library.services.mjs` to a top-level `export const MAX_BORROW_LIMIT` and reference it locally within the borrow logic.
- [ ] T004 [P] [Backend] **Extend User Model Selection and Update SQL**:
  Modify `src/server/src/models/user.models.mjs` queries inside `getUserById` and `updateUser` to include columns `occupation`, `birth_date`, `gender`, `hometown`, and `description`. Use SQL column aliases (`AS`) to map them to camelCase properties, matching the existing `user_id AS "userId"` pattern.
- [ ] T005 [P] [Backend] **Update Profile Fetch Controller**:
  Modify `getProfile` inside `src/server/src/controllers/user.controllers.mjs` to import `MAX_BORROW_LIMIT` and append it as `maxBorrowLimit` to the JSON payload returned to the client.
- [ ] T006 [P] [Backend] **Update Profile Update Controller with Gender Check**:
  Extend `updateProfile` inside `src/server/src/controllers/user.controllers.mjs` to accept the new fields, validate that `gender` equals `'male'`, `'female'`, `'other'`, or is `null`/empty, invoke the extended `updateUser` model, and return camelCase payload.

---

## Phase 3: User Story 1 - Profile Details Form (Priority: P1) 🎯 MVP

**Goal**: Rebuild the profile page main content area into the redesigned form, complete with page-level Save/Cancel state tracking and phone number format checks.

**Independent Test**: Navigate to `/profile`. Verify that the redesigned grid sections load cleanly. Check that editing any field enables the Save Changes/Cancel buttons, and clicking Cancel reverts them. Save changes, enter invalid phone numbers, and verify error interceptions and success events.

- [ ] T007 [US1] **Refactor Profile Page Form Layout**:
  Refactor `src/client/app/profile/page.tsx` states to hold the new fields. Rebuild the form UI inside cards wrapped by `ProfileSectionCard` (using `FormField` components, standard input `type="date"` for Birth Date, custom select dropdown `CustomSelect` for Gender, and a custom textarea for Description).
- [ ] T008 [US1] **Preserve Save Changes/Cancel State Flow**:
  Ensure `src/client/app/profile/page.tsx` tracks dirty state by comparing current `profile` state against the database-matched `savedProfile` state (preserving the page-level save pattern from feature 018). Wire the buttons at the bottom.
- [ ] T009 [US1] **Preserve Phone Number Regex Check**:
  Add validation trigger in `src/client/app/profile/page.tsx` `handleSaveChanges` that matches the phone value against `/^\d{9,10}$/` (preserving feature 019). Display inline error `profile.phone_validation_error` in red below the phone field if validation fails.
- [ ] T010 [US1] **Integrate Form Handlers with extended API**:
  Update `src/client/app/profile/page.tsx` fetch callbacks to correctly handle camelCase data formats and transmit the newly editable columns to the server.

---

## Phase 4: User Story 2 - Borrowing Information Sidebar Widget (Priority: P2)

**Goal**: Integrate the borrowing metrics card section inside the Left Sidebar.

**Independent Test**: Mount `/profile` page, and check the Left Sidebar. Verify that the "Borrowing Information" section renders below the nav items showing your active books borrowed and the backend maximum borrow limit.

- [ ] T011 [US2] **Update ProfileTemplate props**:
  Modify `src/client/app/components/templates/ProfileTemplate.tsx` to receive the `maxBorrowLimit` prop and forward it to `Sidebar`.
- [ ] T012 [US2] **Implement Sidebar Widget**:
  Update `src/client/app/components/organisms/Sidebar.tsx` to accept the `maxBorrowLimit` prop. Insert the Borrowing Information widget above the logout container. Structure using flex layout, divider border (`border-t border-[#C6C6CD] dark:border-neutral-700`), and localized labels for limit/borrow count.

---

## Phase 5: User Story 3 - Responsive & Design-Token Cleanup (Priority: P3)

**Goal**: Audit styling implementations, dark mode tokens, and mobile breakpoints.

**Independent Test**: Toggle dark mode and verify consistent, readable colors on all inputs, select options, and widgets. Resize browser to mobile size (<768px) and ensure stacked layout adapts smoothly with no overflows.

- [ ] T013 [P] [US3] **Style Audit & Dark Mode Compliance**:
  Check that all colors in form cards and sidebar widget use theme tokens and Tailwind dark variants (`dark:bg-neutral-800`, `dark:border-neutral-700`, `dark:text-neutral-200`) instead of hardcoded colors.
- [ ] T014 [P] [US3] **Responsive Grid Stack**:
  Ensure card grids stack vertically on mobile (e.g. using `grid-cols-1 md:grid-cols-2`) and padding adjustments are responsive, preserving standard viewport margins.

---

## Phase 6: Polish & Verification

**Goal**: Conduct validation and sanity checks.

- [ ] T015 [Polish] **Run Verification Guidelines**:
  Perform all step-by-step checks defined in `quickstart.md` to guarantee integration reliability and log-free operations.

---

## Dependencies & Execution Order

### Phase Dependencies
1. **Localization & Setup (Phase 1)** and **Backend Services (Phase 2)** must be implemented first. Since they edit different files, they can run in parallel.
2. **User Story 1 (Phase 3)**: Core form redesign. Blocks final layout cleanups.
3. **User Story 2 (Phase 4)**: Sidebar widget. Can run in parallel with or after Phase 3, once Phase 2 (Backend Services) is complete.
4. **Responsive Cleanup (Phase 5)** and **Polish (Phase 6)**: Run last after all core functionalities have been wired.

### Parallel Execution Paths
- **Path A (Frontend)**: T001, T002 -> T007, T008, T009, T010 -> T011, T012 -> T013, T014.
- **Path B (Backend)**: T003 -> T004 -> T005, T006.
- **Integration**: Path A and Path B meet at T010, where the frontend form is wired to the extended backend endpoints.
