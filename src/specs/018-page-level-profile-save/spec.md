# Feature Specification: Page Level Profile Save Changes

**Feature Branch**: `018-page-level-profile-save`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Modify src/client/app/profile/page.tsx and src/client/app/components/molecules/ProfileCard.tsx. Move the save logic from ProfileCard up to the page level. ProfileCard should only update local state when user edits, not call onUpdate immediately. Add a single Save Changes button at the bottom right of the profile page (below the grid). The button is disabled when no fields have been changed compared to the original loaded values. When clicked, it calls the API to save all changed fields at once and shows success/error message. Add a Cancel button next to Save that resets all fields back to original values. Follow dark mode Tailwind conventions, no hardcoded colors."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Page-Level Profile Updates (Priority: P1)

As a user, I want to edit multiple profile fields locally first, then apply all changes simultaneously using a single "Save Changes" button, or discard all edits with a "Cancel" button.

**Why this priority**: Minimizes backend API requests and provides a more controlled form completion workflow, where saving is explicit and final.

**Independent Test**: Edit the Full Name and Phone Number fields. Verify the changes are visible in the cards but do not cause API updates. Verify the page-level Save Changes and Cancel buttons become active. Click Cancel and verify all values restore. Edit again and click Save Changes to confirm the updates.

**Acceptance Scenarios**:

1. **Given** a user is on the profile settings page, **When** they edit any field, **Then** the card updates locally in the page's profile state but does NOT call the backend API immediately.
2. **Given** no profile fields have been modified compared to the original loaded values, **Then** the page-level "Save Changes" button is disabled.
3. **Given** the user has edited one or more fields, **When** they click the page-level "Cancel" button, **Then** all profile fields are reset to their original loaded values and the Save Changes button becomes disabled.
4. **Given** the user has edited one or more fields, **When** they click the page-level "Save Changes" button, **Then** a single API PUT request is sent to the backend `/user/profile` containing all changed fields.
5. **Given** the API call succeeds, **When** the page receives the response, **Then** it updates the page's original values reference, updates the `StoredUser` representation in localStorage, and shows a success banner.

---

### User Story 2 - Localization and Theme Support (Priority: P2)

As a user with language and theme preferences, I want the page-level buttons and feedback messages to adapt to my active language and theme selections.

**Why this priority**: Guarantees localization completeness and accessibility alignment across the application.

**Independent Test**: Toggle the application's locale between English and Vietnamese, and verify that the page-level button text and feedback messages translate correctly. Toggle light/dark mode and check the page-level buttons styling.

**Acceptance Scenarios**:

1. **Given** the user changes the locale, **When** the page renders, **Then** all page-level button labels (e.g., Save Changes, Cancel) and error/success alerts display in the active language.
2. **Given** the user toggles dark mode, **When** the page renders, **Then** the page-level buttons adapt to the dark mode styling system.

---

### Edge Cases

- **API Failure**: If the backend update fails, the edit state must remain in place, showing a localized error message. The Save Changes and Cancel buttons must remain active.
- **Empty Field Values**: If a user clears an input field (e.g. Full Name), the Save Changes button is enabled (if it changed), but validation must check for minimum requirements before sending.
- **Authentication Timeout**: If the user's session expires while editing, clicking Save Changes must redirect them to the Login page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: ProfilePage MUST keep track of both the current edited state (`profile`) and the original database state (`originalProfile` / `initialProfile`).
- **FR-002**: `ProfileCard`'s `onUpdate` prop MUST only update the `profile` state at the page level and MUST NOT call any API.
- **FR-003**: System MUST render a page-level Save Changes button and a Cancel button at the bottom right of the profile page (below the grid).
- **FR-004**: The page-level Save Changes button MUST be disabled if `profile` is identical to `originalProfile`.
- **FR-005**: Clicking the page-level Cancel button MUST reset `profile` state to `originalProfile`.
- **FR-006**: Clicking the page-level Save Changes button MUST trigger a single PUT request to `/user/profile` containing all changed fields (`username` and/or `phoneNumber`).
- **FR-007**: Button labels MUST be localized (e.g. `profile.save_changes`, `profile.cancel`).
- **FR-008**: Page-level buttons MUST follow dark mode Tailwind conventions without hardcoded color codes.

### Key Entities *(include if feature involves data)*

- **Profile State**: State managing the current profile values.
- **Original Profile State**: State managing the original loaded profile values.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking Save Changes saves all edited fields in a single HTTP request.
- **SC-002**: Saving updates the local storage `StoredUser` representation correctly.
- **SC-003**: Dynamic theme and localization switching works seamlessly.

## Assumptions

- **A-001**: Existing profile pages dynamically update upon successful `onUpdate` callback.
