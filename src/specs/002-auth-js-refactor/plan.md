# Implementation Plan: Auth JS Refactor

**Branch**: `002-auth-js-refactor` | **Date**: 2026-06-10 | **Spec**: [specs/002-auth-js-refactor/spec.md](specs/002-auth-js-refactor/spec.md)

**Input**: Feature specification from `/specs/002-auth-js-refactor/spec.md`

## Summary

Refactor the authentication module (specifically the login form) from TypeScript to pure JavaScript, adopting the Next.js App Router folder structure (`src/client/app/login/`) and decomposing the UI into smaller, responsive components without absolute positioning. The approach utilizes React's `useState` for interactive mocking of loading and error states.

## Technical Context

**Language/Version**: JavaScript (ES6+) / Node.js 18+

**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Tailwind CSS

**Storage**: N/A (Frontend components only)

**Testing**: Interactive manual validation via `StateMockConsole` (Local state toggles)

**Target Platform**: Web (Responsive: Mobile, Tablet, Desktop)

**Project Type**: Web application (Next.js)

**Performance Goals**: Instant UI updates (under 100ms) for mock state transitions.

**Constraints**: Absolute positioning is strictly forbidden; all layouts must be fluid and responsive using Tailwind CSS.

**Scale/Scope**: Refactoring the login module into 6 independent sub-components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Component-Driven & Reusability**: Components are decomposed into logical, reusable units (`InputField`, `BrandPanel`, etc.).
- [x] **II. State Management**: Uses local `useState` to explicitly handle `loading`, `error`, and `validation` states.
- [x] **III. Responsive & Beautiful Design**: Mobile-first responsive layout using Flexbox/Grid; follows project color palette and typography.
- [x] **IV. Performance Optimization**: Uses Next.js App Router conventions; client components are clearly marked.
- [x] **V. Error Handling & Accessibility**: Robust mock states for testing error handling and input validation UI.

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-js-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           
│   └── ui-contract.md   # Phase 1 output
└── tasks.md             # Phase 2 output (to be generated)
```

### Source Code (repository root)

```text
src/client/app/
└── login/
    ├── page.js               # Entry point layout shell
    ├── BrandPanel.js         # Branding visual panel
    ├── FormCard.js           # Auth form wrapper
    ├── InputField.js         # Reusable form fields
    ├── OAuthButtons.js       # Social login connectors
    └── StateMockConsole.js   # State inspector controls
```

**Structure Decision**: Standard Next.js App Router folder structure under `src/client/app/login/` to ensure clean routing and component colocation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No violations detected)*
