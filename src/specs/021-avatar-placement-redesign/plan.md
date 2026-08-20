# Implementation Plan: Avatar Placement Redesign

**Branch**: `021-avatar-placement-redesign` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-avatar-placement-redesign/spec.md`

## Summary

Redesign avatar placement and sizing on the digital library profile page by migrating the `AvatarUploader` component from the main profile content area into the left `Sidebar` permanently. Increase the size of the sidebar avatar display to be prominent, and subscribe the top `NavBar` (`AuthActions` component) to avatar state changes to sync the navbar avatar icon instantly when updates occur. The main profile content area will be cleaned up to show only profile info/metadata cards.

## Technical Context

- **Language/Version**: Next.js v13+ (React 18), TypeScript v5.0+, Node.js v18+
- **Primary Dependencies**: `react`, `next`, `tailwindcss` (Client)
- **Storage**: `localStorage` (persisting the user session object)
- **Testing**: Jest/React Testing Library
- **Target Platform**: Web browsers
- **Project Type**: Web application frontend
- **Performance Goals**: Instantly propagate avatar update changes on screen (<1.5s)
- **Constraints**: Maintain Atomic Design and i18n localization compliance; support Light/Dark theme utility classes.
- **Scale/Scope**: Moderate complexity frontend refactoring affecting layout-level components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | Description |
|------------------|--------|-------------|
| **I. Component-Driven** | Compliant | Reuses the existing `AvatarUploader` molecule. Add it to `molecules/index.ts` to ensure consistent exports. |
| **II. Data Fetching & State** | Compliant | Uses React state lifting to propagate updates synchronously, and invokes `updateStoredUser` to update local storage. |
| **III. UI/UX Design** | Compliant | Implements responsive flexbox layouts and consistent overlay hover interactions. |
| **IV. Performance** | Compliant | Avoids layout shift and redundant network fetches by using prop state forwarding. |
| **V. Error Handling** | Compliant | Integrates error states within the uploader and falls back gracefully to initials. |
| **VI. Directory Hierarchy** | Compliant | Strictly modifies existing files in `src/client/app/components` and `src/client/app/profile`. |
| **VII. Layered Architecture** | Compliant | Relies on client-side components and existing backend endpoints without architectural drift. |
| **VIII. Import Paths** | Compliant | Verified import paths relative to target components. |
| **IX. Theme & Localization** | Compliant | Adheres to dark mode Tailwind utility classes and uses i18n localization keys from locales. |

## Project Structure

### Documentation (this feature)

```text
specs/021-avatar-placement-redesign/
├── plan.md              # This file
├── research.md          # Technology research and architectural decisions
├── data-model.md        # Session state details and schema columns
├── quickstart.md        # Local environment run instructions
└── contracts/
    └── api.md           # API endpoints contract details
```

### Source Code

**Frontend Structure (`src/client/app/`):**
```text
components/
├── molecules/
│   ├── index.ts              # Exports AvatarUploader
│   ├── AvatarUploader.tsx    # Reused uploader component
│   └── AuthActions.tsx       # Updated to display image avatar if available
├── organisms/
│   ├── Sidebar.tsx           # Updated to embed AvatarUploader with size increase
│   └── NavBar.tsx            # Receives avatarUrl prop and passes it down
└── templates/
    └── ProfileTemplate.tsx   # Receives avatarUrl/onAvatarUpdate props to feed layout
profile/
├── page.tsx                  # Lifts avatar state and feeds ProfileTemplate; removes uploader from main content
└── security/
    └── page.tsx              # Loads avatar from localStorage and feeds ProfileTemplate
```

**Structure Decision**: Fully aligned with the Next.js App Router structure on the client.

## Complexity Tracking

*No Constitution Check violations found.*
