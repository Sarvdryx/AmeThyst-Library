# Implementation Plan: Password Input Toggle Component

**Branch**: `015-password-input-toggle` | **Date**: 2026-06-26 | **Spec**: [/specs/015-password-input-toggle/spec.md](file:///D:/HK3/Library/AmeThyst-Library/src/specs/015-password-input-toggle/spec.md)

**Input**: Feature specification from `/specs/015-password-input-toggle/spec.md`

## Summary

Create a new `PasswordInput` component that wraps the existing `Input` atom, providing a button with eye/eye-off icons to toggle password visibility. Replace all usages of password-type form fields with this new component across the authentication and profile security forms.

## Technical Context

**Language/Version**: TypeScript / React 19 / Next.js 16

**Primary Dependencies**: React, Next.js, TailwindCSS

**Storage**: N/A

**Testing**: N/A

**Target Platform**: Desktop & Mobile Browsers

**Project Type**: Web application

**Performance Goals**: State toggles must be instantaneous (< 20ms).

**Constraints**: Must strictly follow Atomic design guidelines, use semantic Tailwind classes for styling (fully support dark/light theme transitions), and avoid form submit triggering.

**Scale/Scope**:
- 1 new atom component `PasswordInput.tsx`
- Export configuration in `atoms/index.ts`
- Replacement of form fields in 4 files under `src/client/app/components/organisms/`:
  - `RegisterFormCard.tsx`
  - `SecurityFormCard.tsx`
  - `LoginFormCard.tsx`
  - `ForgotPasswordCard.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Component-Driven & Reusability**: PASS. Creating `PasswordInput` as a highly reusable atomic component inside the `src/client/app/components/atoms/` folder.
- **Theme System (Light/Dark Mode)**: PASS. SVG icons and button styling will utilize theme-aware Tailwind classes such as `text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300`. Hardcoded colors are avoided.
- **Accessibility & UX**: PASS. Toggle button will specify `type="button"` to prevent form submission, and include `aria-label` tags for screen readers.

## Project Structure

### Documentation (this feature)

```text
specs/015-password-input-toggle/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Task checklist (Phase 2 output)
```

### Source Code (repository root)

```text
src/
└── client/
    └── app/
        └── components/
            ├── atoms/
            │   ├── PasswordInput.tsx  # [NEW] Password visibility toggle component
            │   └── index.ts           # [MODIFY] Export the new component
            └── organisms/
                ├── RegisterFormCard.tsx   # [MODIFY] Replace FormField usage
                ├── SecurityFormCard.tsx   # [MODIFY] Replace FormField usage
                ├── LoginFormCard.tsx      # [MODIFY] Replace FormField usage
                └── ForgotPasswordCard.tsx # [MODIFY] Replace FormField usage
```

**Structure Decision**: Frontend atomic component creation and integration into organisms.

## Complexity Tracking

*No violations of the Constitution identified.*
