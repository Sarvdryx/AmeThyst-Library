# Implementation Plan: Profile Phone Number Validation

**Branch**: `019-profile-phone-validation` | **Date**: 2026-06-26 | **Spec**: [/specs/019-profile-phone-validation/spec.md](file:///D:/HK3/Library/AmeThyst-Library/src/specs/019-profile-phone-validation/spec.md)

**Input**: Feature specification from `/specs/019-profile-phone-validation/spec.md`

## Summary

Add client-side validation for the phone number field on the profile settings page. When the user clicks the page-level "Save Changes" button, the phone number value is validated against `/^\d{9,10}$/`. If invalid, the update is halted, and an inline error message is displayed below the phone field. If valid, the error is cleared, and the update request is sent to the backend API.

## Technical Context

**Language/Version**: TypeScript / React 19 / Next.js 16

**Primary Dependencies**: React, Next.js, TailwindCSS

**Storage**: N/A

**Testing**: N/A

**Target Platform**: Desktop & Mobile Browsers

**Project Type**: Web application

**Performance Goals**: Validation check must run instantly (< 1ms) upon button click.

**Constraints**:
- Block API request if validation fails.
- Display localized error message below the phone card.
- Clean up error when user cancels or types a new value.

**Scale/Scope**:
- Modify `page.tsx` to add `phoneError` state, regex validation check, clear error handlers, and render the error element in the UI.
- Add `profile.phone_validation_error` key to `en.json` and `vi.json`.

## Constitution Check

- **State Management & Data Fetching**: PASS. Integrates a simple React state `phoneError` to manage validation messages.
- **Global Localization System**: PASS. Error message uses `t('profile.phone_validation_error')`.
- **Theme System**: PASS. Validation error label styled with standard Tailwind utility class (e.g., `text-red-500` / `dark:text-red-400`).

## Project Structure

### Documentation (this feature)

```text
specs/019-profile-phone-validation/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Task checklist (Phase 2 output)
```

### Source Code (repository root)

```text
src/
└── client/
    └── app/
        ├── profile/
        │   └── page.tsx             # [MODIFY] Implement validation logic and render error label
        └── locales/
            ├── en.json              # [MODIFY] Add profile.phone_validation_error
            └── vi.json              # [MODIFY] Add profile.phone_validation_error
```

**Structure Decision**: State and layout updates inside the profile page component.
