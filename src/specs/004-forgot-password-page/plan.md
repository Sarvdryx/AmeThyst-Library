# Implementation Plan: Forgot Password Page & Global Navigation Update

**Branch**: `004-forgot-password-page` | **Date**: 2026-06-10 | **Spec**: [specs/004-forgot-password-page/spec.md](spec.md)

**Input**: Feature specification from `specs/004-forgot-password-page/spec.md`

## Summary

This feature adds a responsive "Forgot Password" page to the AmeThyst-Library application and removes the navigation bar from existing pages (Home, Library, Login, Register) to create a focused, minimalist interface. The Forgot Password page will be built as a reusable component using React/Next.js, following the atomic design principles defined in the project constitution.

## Technical Context

**Language/Version**: JavaScript (ES6+), TypeScript

**Primary Dependencies**: Next.js (ReactJS), Node.js/Express.js

**Storage**: Persistent user data in existing database (Backend)

**Testing**: Standard project testing (e.g., Jest/RTL for frontend, Supertest for API)

**Target Platform**: Web Browser (Responsive)

**Project Type**: Web Application (Next.js App Router)

**Performance Goals**: Fast page loads, zero Layout Shift

**Constraints**: Responsive design requirements, adhere to constitution styling/spacing

**Scale/Scope**: All authentication and library pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Component-Driven**: New components (ForgotPasswordCard) will be self-contained and prop-driven.
- [x] **State Management**: Lifecycle states (loading, error) will be handled.
- [x] **Responsive/Beautiful Design**: Grid/Flexbox will be used.
- [x] **Performance Optimization**: Next.js best practices will be followed.
- [x] **Error Handling/Accessibility**: Frontend validation and semantic HTML will be used.
- [x] **Structure/Workspace Alignment**: Adhere to existing directory structure.

## Project Structure

### Documentation (this feature)

```text
specs/004-forgot-password-page/
├── plan.md              # Current file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (future)
```

### Source Code (repository root)

```text
client/app/
├── login/
│   └── page.js          # Updated (navbar removed)
├── library/
│   └── page.js          # Updated (navbar removed)
├── register/
│   └── page.js          # Updated (navbar removed)
└── forgot-password/
    ├── page.js          # Updated (imports from components/)
    └── components/
        └── ForgotPasswordCard.jsx # New component (JSX)
```

**Structure Decision**: Using the existing Next.js App Router structure.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
