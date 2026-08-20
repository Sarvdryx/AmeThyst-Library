# Feature Specification: Profile Phone Number Validation

**Feature Branch**: `019-profile-phone-validation`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Add phone number validation to src/client/app/profile/page.tsx. Validation rules: must contain only digits, must be exactly 9 or 10 digits, no spaces or special characters allowed. Show an inline error message below the phone field if validation fails when Save Changes is clicked. Do not call the API if validation fails. Add i18n keys for the error messages to en.json and vi.json."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Phone Number Validation on Save (Priority: P1)

As a user updating my profile settings, I want the application to validate my phone number when I click "Save Changes" so that I do not submit invalid contact information to the server.

**Why this priority**: Prevents invalid data insertion into the database and provides immediate visual feedback.

**Independent Test**: Edit the Phone Number field on the profile settings page. Input an invalid phone number (e.g., containing letters, spaces, special characters, or having a length other than 9 or 10 digits). Click "Save Changes". Verify that an inline error message appears below the phone number field and no network requests are sent to the backend. Modify the phone number to be valid (e.g., exactly 10 digits) and verify that clicking Save Changes clears the error, submits the update successfully, and shows a success banner.

**Acceptance Scenarios**:

1. **Given** a user is on the profile page and has modified the phone number field to contain non-digits (e.g. `123-456-789`), **When** they click "Save Changes", **Then** an inline validation error is shown below the phone number field, and no API request is sent.
2. **Given** a modified phone number with less than 9 digits (e.g. `12345678`) or more than 10 digits (e.g. `12345678901`), **When** they click "Save Changes", **Then** the validation error is shown, and no API request is sent.
3. **Given** a validation error is currently visible, **When** the user edits the phone number field again or clicks "Cancel", **Then** the inline error message is immediately cleared.
4. **Given** a modified phone number containing exactly 9 or 10 digits and only digits, **When** they click "Save Changes", **Then** the validation passes, the error is cleared, and the PUT request is sent to the backend.

---

### User Story 2 - Localization of Validation Feedback (Priority: P2)

As a user with a localized interface preference, I want the phone validation error messages to display in my active language (English or Vietnamese).

**Why this priority**: Guarantees localization completeness for validation messages.

**Independent Test**: Trigger the validation error on the profile page. Toggle the locale switcher between English and Vietnamese, and verify that the inline validation error text adapts correctly.

**Acceptance Scenarios**:

1. **Given** the active locale is English, **When** phone validation fails, **Then** the error message displays: `"Phone number must contain only digits and be exactly 9 or 10 digits."`
2. **Given** the active locale is Vietnamese, **When** phone validation fails, **Then** the error message displays: `"Số điện thoại chỉ được chứa chữ số và phải có độ dài đúng 9 hoặc 10 chữ số."`

---

### Edge Cases

- **Clearing the Phone Field**: If the phone field is cleared (empty string), is it valid or invalid? By default, profile phone number fields are optional or editable. If the user clears the field, we should check if empty is allowed. The rules state: "must contain only digits, must be exactly 9 or 10 digits". A cleared phone number fails this rule, so it should be considered invalid unless it was not modified. If the user clears it, validation fails and displays the error.
- **Spaces inside input**: Even if the number contains digits but includes spaces (e.g., `090 123 456`), validation must fail because "no spaces or special characters allowed".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Phone validation MUST run on the page level when "Save Changes" is clicked.
- **FR-002**: Validation rule: The phone number MUST match the regex `/^\d{9,10}$/`.
- **FR-003**: System MUST NOT dispatch any API requests if phone number validation fails.
- **FR-004**: System MUST render the validation error inline directly below the phone number field in red text (e.g. `text-red-500` or standard Tailwind text-red classes).
- **FR-005**: Editing the phone field locally MUST clear any active validation errors.
- **FR-006**: Clicking "Cancel" MUST clear any active validation errors and reset the fields.
- **FR-007**: Error message text MUST be localized via i18n key `profile.phone_validation_error`.

### Key Entities

- **Phone Validation Error State**: React state storing the active error message (string or empty).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Invalid phone inputs are blocked on the client side with 0 API requests sent.
- **SC-002**: The validation error is clearly displayed inline below the phone number field.
- **SC-003**: Changing the language switches the validation error message dynamically.
- **SC-004**: Code complies with the project's styling and type safety rules.

## Assumptions

- **A-001**: A phone number cannot be empty if it is being saved (since empty doesn't match the 9/10-digit rule).
