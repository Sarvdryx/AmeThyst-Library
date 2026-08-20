# Implementation Plan: Admin Statistics Dashboard Tab

**Branch**: `029-admin-statistics-dashboard` | **Date**: 2026-08-01 | **Spec**: [spec.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/029-admin-statistics-dashboard/spec.md)

**Input**: Feature specification from `/specs/029-admin-statistics-dashboard/spec.md`

## Summary

The Admin Statistics Dashboard Tab provides system administrators with an executive visual overview of library operations. It displays 4 primary summary KPI cards (Total Users, Active/Total Book Borrows, Overdue Books alert count, and Total Late Fees collected), interactive time range filters ("This Week" vs. "This Month") and branch selectors, a Top 10 Book Categories borrow turns bar chart, a ranked Top Borrowed Books panel with cover thumbnails, and a Top Reserved Rooms breakdown with exact reservation turn counts for each branch location.

The feature will be implemented following the project's layered architecture: Next.js Client components under `client/` matching `style1_statistic.css` & `style2_statistic.css`, and Node.js Express backend routes, controllers, services, and models under `server/src/`.

## Technical Context

**Language/Version**: JavaScript (ES Modules `.mjs` for Node.js/Express backend; React/Next.js for frontend)

**Primary Dependencies**: Next.js, React, Express.js, PostgreSQL (`pg`)

**Storage**: PostgreSQL (`database/init_db/postgres`)

**Testing**: Vitest (`server/tests`) & React component tests

**Target Platform**: Web Browsers (Desktop 1280px+ primary, tablet/responsive support)

**Project Type**: Full-stack Web Application (Next.js App Router Client + Node.js Express Backend)

**Performance Goals**: Dashboard API response time <200ms; UI filter toggle updates <2s

**Constraints**: Strict compliance with Digital Library Constitution (Atomic Design system, ES Modules `.mjs`, Layered Backend Architecture, Light/Dark Mode, i18n Localization in `en.json` & `vi.json`)

**Scale/Scope**: System administrators; aggregated metrics across multiple library branches, categories, books, and study rooms.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Component-Driven & Reusability**: PASS (UI components will follow Atomic Design flow in `client/app/components/` and reusable statistics cards/charts).
- **Principle II: State Management & Data Fetching**: PASS (Uses React Context/hooks for filters and fetches backend via `NEXT_PUBLIC_API_URL`).
- **Principle III: Responsive & Beautiful Design**: PASS (Strictly formatted to design tokens, typography, radii, and shadows in `style1_statistic.css` and `style2_statistic.css`).
- **Principle VI: Directory Structure Alignment**: PASS (Frontend in `client/`, backend in `server/src/`).
- **Principle VII: Modular & Abstract Architecture (Backend)**: PASS (Follows `routes -> middlewares -> controllers -> services -> models`).
- **Principle IX: Global Feature Requirements (Light/Dark Mode & Localization)**: PASS (All strings in `en.json` and `vi.json`; colors using design tokens).

## Project Structure

### Documentation (this feature)

```text
specs/029-admin-statistics-dashboard/
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research decisions
├── data-model.md        # Phase 1 data entities and schema payloads
├── quickstart.md        # Phase 1 setup and testing guide
└── contracts/           # Phase 1 OpenAPI API contracts
    └── admin-statistics-api.yaml
```

### Source Code (repository root)

```text
client/
└── app/
    ├── (admin)/
    │   └── admin/
    │       └── statistics/
    │           └── page.jsx                  # Admin Statistics Dashboard tab page
    └── components/
        └── admin/
            └── statistics/
                ├── KpiSummaryRow.jsx         # Total Users, Borrows, Overdue, Late Fee cards
                ├── TopCategoriesBarChart.jsx # Top 10 Categories borrow turns bar chart
                ├── TopBorrowedBooksCard.jsx  # Ranked top books list with thumbnails
                ├── TopReservedRoomsCard.jsx  # Ranked rooms with branch turn statistics
                └── StatisticsHeaderFilter.jsx# Time horizon & branch filter controls

server/
└── src/
    ├── routes/
    │   └── statistics.routes.mjs            # GET /api/admin/statistics
    ├── controllers/
    │   └── statistics.controllers.mjs       # Controller handling request params & response
    ├── services/
    │   └── statistics.services.mjs          # Service performing aggregation logic & DB queries
    ├── models/
    │   └── statistics.models.mjs            # PostgreSQL query blueprints
    └── middlewares/
        └── auth.middlewares.mjs             # Admin authentication middleware
```

**Structure Decision**: Web application layout (`client/` for Next.js App Router client code and `server/` for Node.js Express layered backend).

## Complexity Tracking

> No constitution violations detected. Complexity tracking table not required.
