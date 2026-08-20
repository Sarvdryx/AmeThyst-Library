# Implementation Plan: Book Filter Panel

**Branch**: `009-book-filter-panel` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-book-filter-panel/spec.md`

## Summary
Implement a modern, responsive, and dismissible sidebar filter drawer on the library catalog view (`/library`). When active, it serializes search and filter options into the browser's URL query string, maintaining state sync. The backend API is extended to parse these filters and dynamically query the database utilizing native PostgreSQL array overlaps for multiple genres, branch locations, and available inventory.

## Technical Context

**Language/Version**: Next.js 16 (React 19, TypeScript), Node.js (ES Modules, Express.js)

**Primary Dependencies**: TailwindCSS v4

**Storage**: PostgreSQL (pg pool connection)

**Testing**: Local verification via cURL and browser inspection

**Target Platform**: Responsive Web (Desktop, Tablet, Mobile)

**Project Type**: Web application (Frontend client + Backend API server)

**Performance Goals**: UI opening/dismiss transitions < 200ms, filter api queries < 500ms

**Constraints**: Debounced client-side queries, responsive sidebar overlays

**Scale/Scope**: Mapped standard library branches (LT & NVC), 10 standard genres + Others fallback

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Layered Architecture Compliance**: The backend implements the filters following the `Routes -> Middlewares -> Controllers -> Services` chain, ensuring business logic stays inside fat services and inputs are validated in middleware layers.
- **Atomic Design Flow**: The filter panel is categorized into atomic components (Atoms: `GenreTag.tsx`, Molecules: `YearRangeFilter.tsx`, Organism: `FilterPanel.tsx`).
- **Base API Paths**: The client fetches target API routes dynamically prefixed with `process.env.NEXT_PUBLIC_API_URL`.
- **Environment & Ports**: Frontend runs on port 3000, backend on port 5000.
- **Naming Conventions**: PascalCase components in frontend, camelCase functions, and `.mjs` ES Modules on the backend.

---

## Project Structure

### Documentation (this feature)

```text
specs/009-book-filter-panel/
├── plan.md              # This file
├── research.md          # Phase 0 Research Details
├── data-model.md        # Data Schema Mappings
├── quickstart.md        # Commands for local setup and verification
├── contracts/
│   └── api-books-filter.md # API Contract Details
└── checklists/
    └── requirements.md  # Quality Checklist
```

### Source Code Mapping

```text
client/
├── app/
│   ├── components/
│   │   ├── atoms/
│   │   │   └── GenreTag.tsx             # Visual genre tag checkbox
│   │   ├── molecules/
│   │   │   └── YearRangeFilter.tsx      # Start/End date range fields
│   │   └── organisms/
│   │       └── FilterPanel.tsx          # Sliding side drawer container
│   └── library/
│       └── page.tsx                     # Catalog page reading URL state

server/
└── src/
    ├── controllers/
    │   └── library.controller.mjs       # Controller parsing req.query params
    ├── middlewares/
    │   └── validation.middlewares.mjs   # Checks for startYear/endYear logic
    ├── routes/
    │   └── library.mjs                  # Router definition mapping
    └── services/
        └── library.services.mjs         # Query building and DB querying
```

**Structure Decision**: Multi-project web layout. Separate `client/` frontend components and `server/` backend endpoints structures are maintained according to project constitution conventions.

## Complexity Tracking

*No constitution violations detected. Simpler alternatives (like localStorage) were rejected due to the Spec requirement of URL shareability (Option A).*
