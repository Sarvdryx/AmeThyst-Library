# Implementation Plan: Recent Search History for Logged-In Users

**Branch**: `031-recent-searches` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/031-recent-searches/spec.md`

## Summary
Implement top 5 recent search history display for authenticated users. The feature captures user search queries into `public.search_history`, updates recency timestamp upon re-execution, and exposes a styled, localized dropdown in the search input component when focused. Guest users proceed with normal searching without search history storage or UI overlay.

## Technical Context

**Language/Version**: Node.js ES Modules (`.mjs`) on Backend; Next.js 15 / React 19 (TypeScript / JS) on Frontend  
**Primary Dependencies**: Express.js, PostgreSQL (`pg`), React Context (`AuthProvider`, `I18nProvider`, `ThemeProvider`)  
**Storage**: PostgreSQL (`public.search_history`)  
**Testing**: Manual test flows & quickstart script verification  
**Target Platform**: Web browsers (Desktop, Tablet, Mobile)  
**Project Type**: Web Application (Next.js client + Express.js backend)  
**Performance Goals**: Fetch and render top 5 recent searches in under 200ms  
**Constraints**: Zero impact on guest search experience; maximum 5 entries per user; no duplicate search terms per user  
**Scale/Scope**: Logged-in user sessions across library catalog search inputs  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Component-Driven & Reusability**: PASS. Dropdown component built as an accessible Molecule/Atom within `/components` and integrated into search inputs.
- **II. State Management & Data Fetching**: PASS. Uses `AuthProvider` for session verification; handles loading, success, and error states explicitly. Uses `NEXT_PUBLIC_API_URL`.
- **III. Responsive & Beautiful Design**: PASS. Dropdown uses flex/grid, styled with light/dark tokens, smoothly handling mobile and desktop screens.
- **IV. Performance Optimization**: PASS. Limits query to top 5 rows indexed by `(user_id, created_at DESC)`.
- **V. Error Handling & Accessibility**: PASS. Gracefully handles backend failure (silent fallback to regular search without dropdown crash).
- **VI & VIII. Directory & Import Verification**: PASS. Strictly adheres to workspace tree and Layered Architecture (`routes -> middlewares -> controllers -> services -> models`).
- **IX. Light/Dark Mode & i18n**: PASS. Uses `dark:bg-neutral-800` tokens and translation keys added to `en.json` & `vi.json`.

## Project Structure

### Documentation (this feature)

```text
specs/031-recent-searches/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 design decisions
├── data-model.md        # Entity definitions & flow diagram
├── quickstart.md        # Testing & verification guide
├── contracts/           # API interface specifications
│   └── search-history-api.md
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```text
server/
└── src/
    ├── routes/
    │   └── search.routes.mjs          # Add GET/POST /api/search/history
    ├── controllers/
    │   └── search.controllers.mjs     # Handle search history endpoints
    └── services/
        └── search.services.mjs        # Database queries for search history

client/
└── app/
    ├── components/
    │   └── molecules/
    │       └── SearchBar.tsx          # Integrate recent search history dropdown UI
    ├── locales/
    │   ├── en.json                    # Add recent search i18n keys
    │   └── vi.json                    # Add recent search i18n keys
    └── utils/
        └── searchApi.ts               # Client API helpers for search history
```

**Structure Decision**: Web application layout. Backend Express services handle search history persistence in `public.search_history`; Next.js client renders the UI in `SearchBar.tsx`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | Fully aligned with layered architecture and constitution |
