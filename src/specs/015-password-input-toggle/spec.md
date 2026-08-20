# Feature Specification: Password Input Toggle Component

**Feature Branch**: `015-password-input-toggle`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Create a new PasswordInput atom component in src/client/app/components/atoms that wraps the existing Input atom with a always-visible show/hide password toggle button on the right side. Default state is password hidden with a crossed eye icon. Clicking toggles to show password with a normal eye icon. Use inline SVG for icons. Export from atoms/index.ts. Replace all type='password' FormField usages in RegisterFormCard.tsx, SecurityFormCard.tsx, LoginFormCard.tsx, and ForgotPasswordCard.tsx with the new PasswordInput component. Follow dark mode Tailwind conventions, no hardcoded colors."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Show/Hide Password Toggle (Priority: P1)

As a user entering a password, I want to toggle its visibility so that I can verify my input without displaying it permanently.

**Why this priority**: Directly improves form usability and prevents typing mistakes while typing complex passwords.

**Independent Test**: Enter text in the password field, click the show/hide button on the right of the input, and check if the characters become visible and the icon changes accordingly.

**Acceptance Scenarios**:

1. **Given** the password field is loaded, **When** the user begins typing, **Then** the password characters are hidden (`type="password"`) and a crossed eye icon is displayed.
2. **Given** the user has typed characters, **When** they click the toggle button, **Then** the input type dynamically changes to `"text"`, the password characters become visible, and the icon switches to a normal eye.
3. **Given** the password characters are currently visible, **When** the user clicks the toggle button again, **Then** the input type reverts to `"password"`, characters are masked, and the crossed eye icon is restored.

---

### User Story 2 - Uniform Form Passwords Toggling (Priority: P2)

As a user, I want show/hide toggles on all password fields (Login, Registration, Password Reset, and Security Profile Settings) so that I have a consistent interface across the application.

**Why this priority**: Crucial for UI/UX consistency throughout the main workflows of the application.

**Independent Test**: Navigate to the login, registration, forgot-password, and profile settings forms, verify that every password field features a functioning visibility toggle.

**Acceptance Scenarios**:

1. **Given** the user is on the Registration, Login, Forgot Password, or Security Settings page, **Then** all password fields feature the show/hide toggle button on the right side.
2. **Given** the user clicks any show/hide toggle, **When** a form contains multiple password fields (e.g., password and confirm password), **Then** each visibility toggle controls its own input field independently.

---

### Edge Cases

- **Form Submission**: Clicking the show/hide button MUST NOT submit the form (requires `type="button"` on the toggle button).
- **Accessibility & Focus**: The button must be accessible for keyboard navigation and screen readers using appropriate `aria-label` tags.
- **Autofill Compatibility**: Browser autofill and password manager services must operate normally when `PasswordInput` is used.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a new `PasswordInput` atom component under `src/client/app/components/atoms/PasswordInput.tsx` and export it from `index.ts`.
- **FR-002**: The `PasswordInput` component MUST wrap the existing `Input` atom.
- **FR-003**: The show/hide toggle button MUST be always-visible on the right side of the input field.
- **FR-004**: The default state of the input MUST be password hidden (`type="password"`) with a crossed eye inline SVG icon.
- **FR-005**: Clicking the toggle button MUST alternate between hidden and visible (`type="text"`) states, updating the icon to a normal eye inline SVG icon.
- **FR-006**: The toggle button MUST use `type="button"` to prevent triggering form submissions.
- **FR-007**: The password fields in `RegisterFormCard.tsx`, `SecurityFormCard.tsx`, `LoginFormCard.tsx`, and `ForgotPasswordCard.tsx` MUST be replaced with `PasswordInput`.
- **FR-008**: The component styling MUST follow dark mode Tailwind conventions without hardcoded colors (e.g. using tailwind class colors like `text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300`).

### Key Entities *(include if feature involves data)*

- **PasswordInput State**: Represents whether the password text is currently visible or hidden.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of password input fields on authentication and profile security forms are replaced with `PasswordInput`.
- **SC-002**: Clicking the toggle button transitions visibility status instantly (< 20ms) and never submits the enclosing form.

## Assumptions

- **A-001**: Inline SVGs are used directly without external icon pack dependencies.
- **A-002**: `PasswordInput` matches the height and layout of other form fields.
