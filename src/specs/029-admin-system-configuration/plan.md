# Implementation Plan: Admin System Configuration

**Branch**: `feature/StudyGroup` | **Date**: 2026-08-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/029-admin-system-configuration/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement an admin-only System Configuration screen at the existing `/dashboard/admin/system` destination. The screen loads and atomically updates one file-backed configuration containing the maximum borrowing limit, two penalty fees, and eleven damage coefficients. A validated in-memory snapshot makes successful updates effective immediately, while a durable JSON file preserves them across restarts. The existing borrowing eligibility check, profile response, penalty utilities, and librarian return workflow will all consume the same snapshot so no live business path retains duplicated constants. No PostgreSQL or Memgraph schema/data changes are required.

## Technical Context

**Language/Version**: Node.js ES Modules (local runtime v25.9.0) for the backend; TypeScript/TSX with React 19.2 and Next.js 16.2 App Router for the frontend

**Primary Dependencies**: Express 5.2, built-in `node:fs/promises` and `node:crypto`, existing JWT authentication and role middleware, Next.js client components, Tailwind CSS 4, existing `apiFetch`, i18n provider, and Atomic Design component exports

**Storage**: Durable `server/src/config/system-configuration.json` accessed through a file-backed Model plus one validated in-memory snapshot; no configuration database or graph storage

**Testing**: Vitest 4 and Supertest for backend API integration tests only; no feature-specific unit tests; existing client ESLint and production build checks; browser acceptance checks for responsive, theme, localization, keyboard, business-rule outcomes, and dirty-form behavior

**Target Platform**: One writable application server running exactly one Node.js backend process, plus modern desktop/tablet/mobile web browsers

**Project Type**: Full-stack web application (`server/` Express backend + `client/` Next.js frontend)

**Performance Goals**: Configuration GET and PUT complete within 2 seconds under normal single-process load, excluding environment startup and external network transit; setting changes are visible to the next applicable business operation

**Constraints**: Admin-only access at both route and API layers; configuration values never use database persistence (existing authentication may retain its current account lookup); exactly one backend process owns the file; fixed JSON key set; every field required; Save unavailable whenever any editable value is empty or whitespace-only; finite non-negative numeric fees/coefficients; borrowing limit is a positive whole-number policy value with no separate feature-defined upper bound; `perfect_condition` fixed at zero; atomic all-or-nothing persistence; stale edits rejected; no administrator-triggered restart; existing records are not recalculated

**Scale/Scope**: One server with one Node.js backend process, one configuration document under 10 KB, 14 displayed values, low-frequency administrator writes, and concurrent reads from borrowing/profile/return workflows; clustered or multi-instance deployment is outside scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **I. Component-Driven & Reusability**: The UI is decomposed bottom-up into reusable numeric setting atoms/molecules, policy section organisms, and the page composition under existing component folders.
- [x] **II. State Management & Data Fetching**: The client uses the existing environment-based API client and explicitly represents loading, success, error, dirty, saving, conflict, and discard states.
- [x] **III. Responsive & Beautiful Design**: The existing admin shell remains authoritative for navigation and global behavior, while `admin-system-configuration-layout.txt` is the primary reference for the page title, setting-card composition, compact fields, and per-card Save Changes placement. The implementation adapts that desktop layout responsively without copying unrelated settings.
- [x] **IV. Performance Optimization**: The interactive admin form remains a client component; its fixed, small payload and cached server snapshot avoid repeated disk reads in business operations.
- [x] **V. Error Handling & Accessibility**: Labeled numeric controls, field-level validation, keyboard focus, status announcements, and recoverable load/save/conflict feedback are part of the contracts.
- [x] **VI. Directory Structure & Workspace Alignment**: All planned files use verified `client/app` and `server/src` locations; the canonical JSON uses the backend's existing `server/src/config/` directory.
- [x] **VII. Modular & Abstract Backend**: The API follows `route -> auth/role/validation middleware -> controller -> service -> file-backed model`; Middleware and Service reuse a pure validation utility without depending on one another, configuration/path options remain in config, persistence remains in the Model, and penalty calculation remains centralized and testable.
- [x] **VIII. Import Path Verification**: Planned imports were derived from the actual workspace tree, including the existing `.mjs` conventions and component barrel exports.
- [x] **IX. Theme & Localization**: New controls use existing light/dark conventions and all copy is added to both `client/app/locales/en.json` and `client/app/locales/vi.json`.
- [x] **Database safeguard**: No database change is planned, so SQL schema inspection and migrations are not applicable.

**Post-design gate**: PASS. Phase 1 introduces no constitutional violation and no complexity exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/029-admin-system-configuration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── system-configuration-api.md
├── checklists/
│   └── requirements.md
├── admin-system-configuration-layout.txt
└── spec.md
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── config/
│   │   ├── system-configuration.config.mjs      # Canonical path and process/runtime options
│   │   └── system-configuration.json            # Mutable durable policy document
│   ├── controllers/
│   │   ├── system-configuration.controllers.mjs # Thin GET/PUT response mapping
│   │   └── user.controllers.mjs                 # Read dynamic borrowing limit
│   ├── middlewares/
│   │   └── system-configuration.middlewares.mjs # Envelope checks using shared pure validator
│   ├── models/
│   │   └── system-configuration.models.mjs      # JSON load and atomic file persistence boundary
│   ├── routes/
│   │   └── system-configuration.routes.mjs      # Admin-protected endpoints
│   ├── services/
│   │   ├── system-configuration.services.mjs    # Versioning/conflict/update orchestration
│   │   ├── library.services.mjs                 # Dynamic maximum borrowing limit
│   │   └── dashboard.librarian.services.mjs     # Centralized configured penalty calculation
│   ├── utils/
│   │   ├── penalty.utils.mjs                    # Pure calculations fed a policy snapshot
│   │   └── system-configuration.utils.mjs       # Pure canonical validation and serialization
│   └── server.mjs                               # Initialize config and mount router
└── tests/
    └── integration/system-configuration.api.spec.mjs

client/app/
├── dashboard/admin/system/page.tsx              # Existing route, replaced placeholder
├── components/
│   ├── atoms/ConfigurationNumberInput.tsx       # Unlabeled numeric control primitive
│   ├── molecules/ConfigurationField.tsx
│   └── organisms/SystemConfigurationForm.tsx
├── locales/en.json
├── locales/vi.json
└── utils/apiClient.ts                            # Reuse without base-URL duplication
```

**Structure Decision**: Keep the existing two-project layout. Persist the mutable document in the backend's verified existing `server/src/config/` directory, expose it through the established `route -> middleware -> controller -> service -> model` chain, and compose the screen from existing Atomic Design directories. The Model is file-backed and performs no database access; the config module only resolves immutable runtime options such as the canonical file path.

## Phase 0: Research Outcomes

Research decisions and alternatives are captured in [research.md](research.md). All technical unknowns are resolved.

## Phase 1: Design Outcomes

- Data shape, validation, versioning, and state transitions: [data-model.md](data-model.md)
- Admin GET/PUT interface and error semantics: [contracts/system-configuration-api.md](contracts/system-configuration-api.md)
- Setup and verification workflow: [quickstart.md](quickstart.md)
- Agent context: `AGENTS.md` points its managed Spec Kit section to this plan.

## Implementation Sequence

1. Add the canonical JSON document and path configuration, then implement the file-backed Model and one pure canonical validation/serialization utility shared by middleware and Service, followed by the immutable service snapshot, serialized atomic writer, and version derivation.
2. Add service/controller/middleware/router layers for admin GET and PUT, then mount the router only after configuration initialization succeeds.
3. Remove hardcoded policy constants from live consumers: borrowing reservation checks, profile response, penalty utilities, and the duplicated librarian return calculation.
4. Add API integration coverage for valid updates, validation, stale versions, authorization, response timing, ordinary write failures, and an injected Model interruption immediately before replacement; verify configured borrowing and penalty outcomes through the documented manual acceptance flow rather than feature-specific unit tests.
5. Build the UI bottom-up in the existing Atomic Design folders, replace the placeholder page, and reuse the admin shell, API client, form feedback, theme, and localization systems.
6. Add English/Vietnamese strings, verify responsive and keyboard behavior, then run backend tests, client lint/build, technical response checks, and the stakeholder-owned quickstart acceptance scenarios.
