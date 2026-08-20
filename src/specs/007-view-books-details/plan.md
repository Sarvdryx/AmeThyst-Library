# Implementation Plan: View Book Details

**Branch**: `007-view-books-details` | **Date**: 2026-06-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-view-books-details/spec.md`

## Summary

The goal is to implement a comprehensive Book Details page that allows users to view metadata, check real-time availability (including physical location), and reserve books for pickup. The implementation will follow a full-stack approach with a Next.js frontend and a Node.js/Express backend, adhering to Atomic Design principles and a Layered Architecture.

## Technical Context

**Language/Version**: JavaScript (Node.js 20+, React 19)

**Primary Dependencies**: Next.js 16.2.6, Express 5.2.1, TailwindCSS 4

**Storage**: PostgreSQL (via existing DB service)

**Testing**: ESLint (Frontend), Manual validation (Backend)

**Target Platform**: Modern Web Browsers

**Project Type**: Full-stack Web Application (Next.js + Express)

**Performance Goals**: < 2s for reservation processing; optimized image loading using `next/image`.

**Constraints**: Strict compliance with `constitution.md` (Atomic Design, Layered Architecture, `.mjs` extensions).

**Scale/Scope**: Single feature addition to the library system.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Atomic Design Compliance**: Components will be broken down into Atoms, Molecules, and Organisms in `client/app/components`.
- [x] **Layered Backend Architecture**: New endpoints will follow `Route -> Middleware -> Controller -> Service -> Model`.
- [x] **Naming Conventions**: camelCase for frontend variables, PascalCase for components/models.
- [x] **Environment Variables**: Backend URL loaded via `NEXT_PUBLIC_API_URL`.
- [x] **Modular Backend**: Use of ES Modules (`.mjs`) and directory-specific naming patterns.

## Project Structure

### Documentation (this feature)

```text
specs/007-view-books-details/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── api-contract.md
```

### Source Code (repository root)

```text
client/
└── app/
    ├── library/
    │   └── [id]/
    │       └── page.tsx      # Main Book Details Page
    └── components/
        ├── atoms/            # Buttons, Badges, Icons
        ├── molecules/        # Info Grid Items, Status Bar
        └── organisms/        # Header, Footer, Recommendation Carousel

server/
└── src/
    ├── controllers/
    │   └── library.controller.mjs
    ├── models/
    │   └── library.models.mjs
    ├── routes/
    │   └── library.mjs
    └── services/
        └── library.services.mjs
```

**Structure Decision**: Standard web application structure separating `client/` (Next.js App Router) and `server/` (Express API).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
