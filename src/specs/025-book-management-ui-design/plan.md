# Implementation Plan: Book Management UI Design

**Branch**: `025-book-management-ui-design` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/025-book-management-ui-design/spec.md`

## Summary

Design and implement a 4-tab Book Management Dashboard for librarians covering Book Inventory, Book Pickups, Book Returns, and Return Inspection. The UI must follow Atomic Design methodology, support light/dark mode, and use i18n (EN/VI). This is a frontend-only feature using mock data — no backend integration for v1.

## Technical Context

**Language/Version**: Next.js 16 (React 19), ES Modules

**Primary Dependencies**: React, Tailwind CSS v4, existing component library at `src/client/app/components/`

**Storage**: N/A (UI-only feature using static mock data)

**Testing**: Jest + React Testing Library (existing project standard)

**Target Platform**: Web browser (desktop-first; responsive support via existing patterns)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: Tab switches render in under 300ms; search/filter results update in under 500ms

**Constraints**: Must reuse existing atomic design components where possible; must adhere to existing light/dark theme system and i18n dictionaries; no backend API calls in v1

**Scale/Scope**: 4 tab panels, ~30 UI components (atoms/molecules/organisms), mock data only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status | Notes |
|---|------|--------|-------|
| G1 | **Atomic Design Compliance** (Principle I): All new UI must follow bottom-up flow (Atoms -> Molecules -> Organisms -> Templates/Pages). Higher-level components prohibited without defining underlying atomic building blocks. | PASS | Spec explicitly requires atomic breakdown. Existing atoms/molecules/organisms structure in `src/client/app/components/` will be reused/extended. |
| G2 | **Light/Dark Mode** (Principle IX): Hardcoded colors prohibited. Must use Tailwind `dark:` utilities or design tokens. Theme resolves from OS preference, falls back to `light`, persists to localStorage. | PASS | All new components will use Tailwind `dark:` variants and existing theme provider. |
| G3 | **i18n Localization** (Principle IX): Hardcoded text prohibited. All user-facing strings must use `t('key')` from `en.json` / `vi.json`. Both locale files must be updated simultaneously. | PASS | All tab labels, button text, placeholder text, and status labels will use i18n keys. |
| G4 | **State Lifecycle Handling** (Principle II): All data-fetching must handle `loading`, `error`, `success` states explicitly. | PASS (v1 uses mock data — loading/error states still rendered for future API integration) | Mock data with simulated loading states to ensure components are API-ready. |
| G5 | **Directory Structure Alignment** (Principle VI): No new root-level directories. Feature components must live within existing `app/components/` atomic folders. | PASS | All new components will reside under existing `atoms/`, `molecules/`, `organisms/` folders. |
| G6 | **Responsive Design** (Principle III): Must use Grid/Flexbox. Must be fully responsive across Mobile/Tablet/Desktop. | PASS | Existing responsive patterns (Tailwind responsive prefixes) will be applied to all new components. |

**Violations**: None. All gates pass. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/025-book-management-ui-design/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI component contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Web application structure — frontend only for this feature
src/client/
├── app/
│   ├── components/
│   │   ├── atoms/
│   │   │   └── (new atoms: StatusBadge variants, KPIProgressBar, PaginationButton, etc.)
│   │   ├── molecules/
│   │   │   └── (new molecules: KPIStatCard, SearchInputWithIcon, TablePagination, etc.)
│   │   ├── organisms/
│   │   │   └── (new organisms: BookManagementTable, BookPickupTable, BookReturnTable, InspectionPanel, KPIStatsRow)
│   │   └── templates/
│   │       └── (new template: LibrarianDashboardTemplate — composed dashboard layout)
│   ├── dashboard/
│   │   └── librarian/
│   │       └── page.tsx          # Existing page — will be updated to use new dashboard
│   ├── locales/
│   │   ├── en.json               # Updated with new translation keys
│   │   └── vi.json               # Updated with new translation keys
│   └── data/
│       └── mockData.ts           # New mock data for books, pickups, borrows
```

**Structure Decision**: Option 2 — Web application (frontend only). All new components will be placed in the existing Atomic Design folder hierarchy under `src/client/app/components/`. No backend changes needed for v1.

## Complexity Tracking

> Not needed. All Constitution gates pass without violations.

## Research Tasks

### Unknowns from Technical Context

No NEEDS CLARIFICATION markers exist in the spec. The technical context is fully resolvable from the constitution and existing codebase. Research tasks focus on best practices and existing patterns:

1. **Task R1**: Audit existing `atoms/`, `molecules/`, `organisms/` components to identify reusable components for the dashboard (tables, badges, buttons, inputs, modals)
2. **Task R2**: Review existing theme system (ThemeProvider, dark mode utilities) and i18n patterns (locale file structure, key naming convention) to ensure compliance
3. **Task R3**: Review existing mock data patterns in `app/data/mockLoansFees.ts` and `app/study-together/mockData.ts` for consistency
4. **Task R4**: Identify existing table, pagination, and filter patterns in components like `BookTableHeader`, `BookTableRow`, `BookTablePagination`, `FilterPanel`, `SearchBar` for reuse/extension
