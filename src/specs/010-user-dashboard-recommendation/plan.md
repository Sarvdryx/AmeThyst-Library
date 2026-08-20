# Implementation Plan: User Dashboard Recommendation Page

**Branch**: `012-bookinfo-backend-integration` | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-user-dashboard-recommendation/spec.md`

## Summary

Build a new dashboard recommendation page for users that displays personalized and trending books using identical horizontal carousels as the book details page. The page seamlessly integrates into the existing dashboard layout.

## Technical Context

**Language/Version**: TypeScript, React, Next.js (App Router)

**Primary Dependencies**: Tailwind CSS, i18n localization hooks

**Storage**: N/A (Frontend display only, fetching data from backend APIs)

**Testing**: N/A

**Target Platform**: Web browsers (Responsive)

**Project Type**: Web application (Frontend)

**Performance Goals**: Page load under 2 seconds. Smooth carousel scrolling.

**Constraints**: Must match the exact visual design of the existing `RecommendationCarousel`.

**Scale/Scope**: 1 new page route, reusing existing UI components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **UI/UX Design Flow**: Must reuse existing components (like `RecommendationCarousel`) from `client/app/components` as mandated by the Atomic Design flow.
- **Global Feature Requirements**:
  - **Light/Dark Mode**: Must use Tailwind's `dark:` classes. Hardcoded color codes are prohibited.
  - **Localization**: Must use `useI18n()` hook. Hardcoded strings are prohibited. Keys must be added to `en.json` and `vi.json`.
- **Directory Structure**: The page must be placed at `client/app/dashboard/user/recommendations/page.tsx`.

## Project Structure

### Documentation (this feature)

```text
specs/010-user-dashboard-recommendation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
client/
└── app/
    └── dashboard/
        └── user/
            └── recommendations/
                └── page.tsx
```

**Structure Decision**: The feature is a single frontend page under the Next.js App Router, using existing layout components.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
