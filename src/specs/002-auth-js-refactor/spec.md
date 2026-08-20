# Feature Specification: Auth JS Refactor

**Feature Branch**: `002-auth-js-refactor`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Transition from TypeScript to pure JavaScript (.js) and adopt the standard Next.js App Router folder structure for the authentication module, specifically refactoring the login form into decomposed components."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Successful Login Layout (Priority: P1)

As a researcher, I want to access a clean, responsive login page so that I can securely enter my credentials and access the LIMA library.

**Why this priority**: Core entry point for the application.

**Independent Test**: Can be tested by navigating to `/login` and verifying all UI elements (Brand Panel, Form Card, Input Fields, OAuth Buttons) are present and correctly laid out without absolute positioning.

**Acceptance Scenarios**:

1. **Given** I am on the `/login` route, **When** the page loads, **Then** I see the LIMA branding on the left (on desktop) and the login form centered on the right.
2. **Given** I am on a mobile device, **When** I load `/login`, **Then** the LIMA branding panel is hidden, and the login form fills the screen width.

---

### User Story 2 - Interactive Mocking (Priority: P2)

As a developer, I want to toggle mock states (Loading, Error) using a console so that I can verify the UI's behavior under different conditions without a backend.

**Why this priority**: Essential for frontend-only verification and design consistency.

**Independent Test**: Can be tested by clicking the "Toggle Loading" or "Simulate Error" buttons in the `StateMockConsole` and observing the changes in `FormCard` and `InputField`.

**Acceptance Scenarios**:

1. **Given** the mock console is visible, **When** I click "Toggle Loading", **Then** the Sign In button shows a spinner and becomes disabled.
2. **Given** the mock console is visible, **When** I click "Simulate Error", **Then** a red error banner appears with the message "Wrong password".

---

### User Story 3 - Input Validation (Priority: P3)

As a user, I want to see immediate validation feedback when I enter incorrect or missing information so that I can correct my input before submitting.

**Why this priority**: Improves user experience and reduces server-side errors.

**Independent Test**: Can be tested by leaving fields blank or entering invalid formats and verifying that the `InputField` displays the appropriate error state.

**Acceptance Scenarios**:

1. **Given** the email field is empty, **When** I blur the field, **Then** an "Email is required" message appears below the input.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a responsive login page under `src/client/app/login/`.
- **FR-002**: System MUST use pure JavaScript (.js) for all components, removing all TypeScript interfaces and types.
- **FR-003**: System MUST decompose the login view into:
    - `page.js`: Main layout orchestrator.
    - `BrandPanel.js`: Left-side LIMA branding.
    - `FormCard.js`: Form container.
    - `InputField.js`: Reusable input inputs with icons and error states.
    - `OAuthButtons.js`: Google brand connector.
    - `StateMockConsole.js`: State inspector controls.
- **FR-004**: System MUST NOT use absolute positioning for layout; all components must use fluid Tailwind CSS Flex/Grid.
- **FR-005**: System MUST implement local `useState` hooks to manage:
    - `isLoading`: Boolean for loading state.
    - `errorMessage`: String for the top-level error banner.
    - `validationErrors`: Object for field-level errors.
- **FR-006**: System MUST use PascalCase for component filenames and camelCase for hooks and variables as per the Constitution.

### Key Entities *(include if feature involves data)*

- **AuthContext**: (Implicit) The shared state between the mock console and the form components (managed locally via props or state lifting in `page.js`).
- **Credentials**: Object containing `email` and `password` strings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Login page is accessible at `/login` with 0 console errors.
- **SC-002**: UI scales correctly from mobile (375px) to desktop (1440px) using responsive Flexbox/Grid.
- **SC-003**: All 6 requested components are implemented as separate `.js` files in `src/client/app/login/`.
- **SC-004**: Toggling mock states updates the UI within 100ms.

## Assumptions

- [Assumption about tech stack]: The project uses Tailwind CSS for styling as indicated in the existing code.
- [Assumption about assets]: Image `/Image1.png` is available in the public directory.
- [Assumption about icons]: SVG icons will be embedded directly in the components as seen in the original `LoginForm.tsx`.
