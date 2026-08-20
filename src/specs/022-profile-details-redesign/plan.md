# Implementation Plan: Profile Details Redesign & Borrowing Info Widget

**Branch**: `022-profile-details-redesign` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/022-profile-details-redesign/spec.md`

---

## 1. Summary

Redesign the profile page (`/profile`) main content into a "Profile Details" form composed of three cards: "General & Contact Info", "Personal Details", and "Description" (reinstating the bio field, which supersedes spec `020` FR-010). Implement this via a reusable `ProfileSectionCard` molecule component to follow strict Atomic Design principles. Additionally, add a "Borrowing Information" widget in the left sidebar (`Sidebar.tsx`) below the navigation and above the logout container. This widget will fetch and display real data for "Borrowing Limit" (backend constant `MAX_BORROW_LIMIT` exposed in profile API) and "Books Borrowed" (actual borrow count). Both components must support full localization (i18n) and dark mode utility classes.

---

## 2. Technical Context

- **Client Stack**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Server Stack**: Node.js, Express.js (ES modules `.mjs`), PostgreSQL client (`pg`)
- **Key Constraints**:
  - Do not write any database migrations; columns (`occupation`, `birth_date`, `gender`, `hometown`, `description`, `borrow_num`) are already in the DB.
  - Map backend snake_case keys to client camelCase keys (e.g. `birth_date` -> `birthDate`), following the existing `user_id` -> `userId` pattern.
  - Expose and use backend `MAX_BORROW_LIMIT` constant from `library.services.mjs`.
  - Re-introduce the bio field as an editable Description textarea.
  - Preserve page-level Save Changes/Cancel tracking state from feature 018.
  - Preserve phone number regex validation (`/^\d{9,10}$/` on Save click) from feature 019.
  - Do not modify avatar-related uploader or display logic (handled in feature 021).

---

## 3. Constitution Check

| Principle / Gate | Status | Description |
| :--- | :--- | :--- |
| **I. Component-Driven** | Compliant | Creates a reusable `ProfileSectionCard` molecule instead of duplicating card layouts. |
| **II. Data Fetching & State** | Compliant | Extends the profile API endpoints. Implements frontend state tracking for dirty state checking and cancellation. |
| **III. UI/UX Design** | Compliant | Adapts the Figma mockup to a proper responsive grid/flexbox flow without hardcoded positions. |
| **IV. Performance** | Compliant | Exposes the borrow limit in the profile payload to prevent duplicate HTTP requests. |
| **V. Error Handling** | Compliant | Preserves the phone validation regex and displays localized alerts on errors. |
| **VI. Directory Hierarchy** | Compliant | Modifies code only inside existing workspace structure (`src/client`, `src/server`). |
| **VII. Layered Architecture** | Compliant | Follows the `Route -> Controller -> Model` backend layering path for profile updates. |
| **VIII. Import Paths** | Compliant | Verifies imports against actual relative paths. |
| **IX. Theme & Localization** | Compliant | Adds translation keys to English/Vietnamese locales and styles components using Tailwind dark variant selectors. |

---

## 4. Project Structure

### Documentation (this feature)
```text
src/specs/022-profile-details-redesign/
├── spec.md               # Feature specification
├── plan.md               # This file
├── research.md           # Research and decisions
├── data-model.md         # Database columns and state mapping
├── quickstart.md         # Environment setup and manual testing
└── contracts/
    └── api.md            # API endpoint contracts
```

### Affected Files list

#### Backend (`src/server/src/`)
- `services/library.services.mjs`: Export the `MAX_BORROW_LIMIT` constant.
- `models/user.models.mjs`: Update `getUserById` and `updateUser` to include the new fields (`occupation`, `birth_date`, `gender`, `hometown`, `description`) in the SELECT/UPDATE clauses, using SQL aliases to return camelCase keys.
- `controllers/user.controllers.mjs`: Update the controller update and profile fetch methods to retrieve the new fields and the exported `MAX_BORROW_LIMIT`.

#### Frontend (`src/client/app/`)
- `locales/en.json` & `locales/vi.json`: Add translation strings for new labels, options, and widget text.
- `components/molecules/ProfileSectionCard.tsx`: Create a new reusable molecule component wrapper for the form cards.
- `components/molecules/index.ts`: Export the `ProfileSectionCard`.
- `components/organisms/Sidebar.tsx`: Embed the new "Borrowing Information" widget above the logout container.
- `profile/page.tsx`: Rebuild the form layout using `ProfileSectionCard` cards, mapping new fields, implementing custom date pickers, CustomSelect dropdowns, and textareas. Maintain dirty-state checking, phone validation, cancel reverts, and language syncs.

---

## 5. Detailed Tasks

### Phase 1: Backend Update & Constant Export
- **Task 1.1**: Export `MAX_BORROW_LIMIT = 5` in `src/server/src/services/library.services.mjs`.
- **Task 1.2**: Update SQL SELECT query inside `getUserById` (`src/server/src/models/user.models.mjs`) to retrieve new columns with camelCase aliases (`occupation`, `birth_date AS "birthDate"`, `gender`, `hometown`, `description`, `borrow_num AS "borrowNum"`, `user_id AS "userId"`).
- **Task 1.3**: Update SQL UPDATE query inside `updateUser` (`src/server/src/models/user.models.mjs`) to process and return new columns with camelCase aliases.
- **Task 1.4**: Update `getProfile` inside `src/server/src/controllers/user.controllers.mjs` to append `maxBorrowLimit` (imported from library services) to the user JSON response.
- **Task 1.5**: Update `updateProfile` inside `src/server/src/controllers/user.controllers.mjs` to retrieve camelCase profile details, sanitise/verify types, and invoke `updateUser`.

### Phase 2: i18n & Molecule Creation
- **Task 2.1**: Update `src/client/app/locales/en.json` with the new localization keys under the `profile` object.
- **Task 2.2**: Update `src/client/app/locales/vi.json` with the corresponding Vietnamese keys.
- **Task 2.3**: Create `src/client/app/components/molecules/ProfileSectionCard.tsx` wrapping contents inside a beautifully styled card panel with dark mode and responsive flex layouts. Export it in `index.ts`.

### Phase 3: Sidebar Widget Integration
- **Task 3.1**: Edit `src/client/app/components/organisms/Sidebar.tsx`.
- **Task 3.2**: Read the `maxBorrowLimit` and `borrowNum` props and embed the "Borrowing Information" card section above the logout button. Apply borders and text styling matching the Figma references.

### Phase 4: Form Redesign & Integration
- **Task 4.1**: Edit `src/client/app/profile/page.tsx` and refactor the state objects `profile` and `savedProfile` to hold all 7 form fields.
- **Task 4.2**: Replace the grid of `ProfileCard` components with card elements wrapped by the new `ProfileSectionCard` molecule.
- **Task 4.3**: Implement inputs using the `FormField` component. Feed Gender into `CustomSelect`, Birth Date into `Input` with `type="date"`, and Description into a custom multiline `<textarea>`.
- **Task 4.4**: Wire up the "Save Changes" and "Cancel" buttons. Implement the state diff calculation for `isChanged` covering all form fields.
- **Task 4.5**: Re-integrate the phone number validation check and error display. Verify success/error banner actions and language changes.
