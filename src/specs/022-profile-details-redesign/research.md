# Research & Architectural Decisions: Profile Details Redesign

This document outlines the technical research, architectural decisions, and design patterns utilized in the profile redesign and sidebar widget integration.

## 1. Reusable Card Molecules (Atomic Design)

* **Decision**: Create a reusable molecule component `ProfileSectionCard` under `src/client/app/components/molecules/ProfileSectionCard.tsx` instead of duplicating card structures on the profile page.
* **Rationale**:
  - The Figma layout has multiple sections (General & Contact Info, Personal Details, Description) which share identical border, spacing, background shadow, title layout, and dark mode classes.
  - Creating a reusable wrapper molecule satisfies the Atomic Design constitution. It encapsulates styling details (`p-6 border border-[#E7E5E4] dark:border-neutral-700 shadow-sm rounded-lg bg-white dark:bg-neutral-800`), allowing layouts to stay consistent and easily maintainable.
  - Keeps `/profile/page.tsx` code extremely clean, declarative, and readable.

---

## 2. Dynamic Borrowing Limit Retrieval

* **Decision**: Export the `MAX_BORROW_LIMIT` constant from `src/server/src/services/library.services.mjs` and expose it inside the user profile response, rather than querying it from the database or hardcoding it in the frontend.
* **Rationale**:
  - `MAX_BORROW_LIMIT` is already defined in `library.services.mjs` (set to `5`) and is used by the database transaction logic.
  - Keeping it as a single source of truth prevents synchronization issues between the frontend display and the backend's enforcement.
  - Exposing it via the `GET /user/profile` response payload as `maxBorrowLimit` makes it instantly accessible to the sidebar without requiring an additional HTTP API request on client initialization.

---

## 3. Form Field Controls & Inputs

* **Decision**: Reuse the existing `FormField` molecule for input fields (Full Name, Phone Number, Occupation, Hometown) and standard `Input` with `type="date"` for Birth Date. Gender will be implemented using the custom React select atom `CustomSelect`.
* **Rationale**:
  - `FormField` already bundles a label, input, and validation error message, making it a perfect fit.
  - `CustomSelect` is a custom dropdown component already written in the project atoms that handles click, state, overlays, and custom options cleanly. Using it for Gender prevents standard browser dropdown styling inconsistencies and integrates with the active dark/light mode theme.
  - The Description block is implemented using a custom `<textarea>` styled exactly like the `Input` atom to match the design system aesthetics, rather than duplicating wrapper styling.

---

## 4. Prior Specifications Integration

### A. Feature 018 (Page-Level Save/Cancel)
- Form inputs are bound to a mutable state `profile`.
- Saved data is stored in `savedProfile`.
- A deep equality check is run: `isChanged = JSON.stringify(profile) !== JSON.stringify(savedProfile)` (excluding dynamic metrics like `borrowNum` or `maxBorrowLimit`).
- Buttons are disabled unless `isChanged` is true.
- Clicking "Cancel" simply sets `profile` to `savedProfile`, reverting all form inputs instantly.

### B. Feature 019 (Phone Validation)
- Phone validation uses the regex `/^\d{9,10}$/` corresponding to Vietnamese local number lengths.
- Validation runs ONLY when the user clicks "Save Changes".
- If the regex match fails, the `phoneError` state is set, displaying the localized text below the field, and the submit operation aborts.
- Changing the phone number resets the error state.

### C. Feature 020 (Bio Reinstated)
- Bio field is explicitly reinstated as a textarea under the "Description" header, superseding `020` FR-010's restriction.
- Description is saved to the `description` column in the database.

### D. Feature 021 (No Main-Content Avatar)
- Zero avatar UI elements are rendered on `/profile/page.tsx` main content panel.
- Avatar display and edit trigger controls remain permanently housed in the Left Sidebar (`Sidebar.tsx`) as designed in feature 021.
