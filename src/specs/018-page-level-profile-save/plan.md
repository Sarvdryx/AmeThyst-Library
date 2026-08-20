# Implementation Plan: Page Level Profile Save Changes

**Branch**: `018-page-level-profile-save` | **Date**: 2026-06-26 | **Spec**: [/specs/018-page-level-profile-save/spec.md](file:///D:/HK3/Library/AmeThyst-Library/src/specs/018-page-level-profile-save/spec.md)

**Input**: Feature specification from `/specs/018-page-level-profile-save/spec.md`

## Summary

Move the profile API update logic from the individual `ProfileCard` components up to the `ProfilePage` level. A single "Save Changes" and "Cancel" button layout will be rendered at the bottom of the profile page to save or revert all fields at once.

## Technical Context

**Language/Version**: TypeScript / React 19 / Next.js 16

**Primary Dependencies**: React, Next.js, TailwindCSS

**Storage**: localStorage (to update stored user details upon save).

**Testing**: N/A

**Target Platform**: Desktop & Mobile Browsers

**Project Type**: Web application

**Performance Goals**: Comparing profile states must occur instantly (< 10ms) to update button disabled status.

**Constraints**:
- Single PUT request to the backend for all modified fields.
- Dark mode compatibility for the new buttons.
- Proper error and success handling state indicators.

**Scale/Scope**:
- Modify `page.tsx` to handle page-level state comparison, cancellation, API saving.
- Modify `ProfileCard.tsx` to ensure `onUpdate` is only used to sync local card values to the page's React state.
- Add `profile.save_changes` and `profile.cancel` localization keys to `en.json` and `vi.json`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **State Management & Data Fetching**: PASS. Maintains clean local state mapping current edits (`profile`) against original loaded data (`originalProfile`) to compute changes.
- **Global Localization System**: PASS. Button labels (`profile.save_changes` and `profile.cancel`) use i18n translation hooks.
- **Theme System**: PASS. Page-level action buttons styled with Tailwind dark/light classes matching existing layout tokens.

## Project Structure

### Documentation (this feature)

```text
specs/018-page-level-profile-save/
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
        │   └── page.tsx             # [MODIFY] Add original state, page-level Save/Cancel buttons, API call
        ├── components/
        │   └── molecules/
        │       └── ProfileCard.tsx  # [MODIFY] Ensure local update only
        └── locales/
            ├── en.json              # [MODIFY] Add profile.save_changes
            └── vi.json              # [MODIFY] Add profile.save_changes
```

**Structure Decision**: Page controller state logic update and component interface integration.

## Complexity Tracking

*No violations of the Constitution identified.*
