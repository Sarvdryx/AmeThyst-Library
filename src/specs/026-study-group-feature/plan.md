# Implementation Plan: Reservation-Backed Study Groups

**Branch**: `feature/StudyGroup` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-study-group-feature/spec.md`

**Note**: This plan covers design through Phase 1 artifacts. Task decomposition is generated separately by `/speckit-tasks`.

## Summary

Extend the existing room reservation system with an end-to-end Study Group lifecycle: atomically create a room reservation and its group, replace Study Together and dashboard mock data, support join requests and the 30-minute post-denial cooldown, provide host/member management, and permanently delete both reservation and group when the host dissolves a group. The backend adds a dedicated Study Group Route → Middleware → Controller → Service → Model stack and transaction-safe PostgreSQL operations; the frontend reuses the current room panel, cards, grid, filters, modals, dashboard, theme, and localization systems while replacing mock-bound types and actions with persisted DTOs.

## Technical Context

**Language/Version**: TypeScript with Next.js 16.2.6 and React 19.2.4 on the client; JavaScript ES modules on Node.js 25.x with Express 5.2.1 on the server

**Primary Dependencies**: Next.js, React, Tailwind CSS 4, `socket.io-client`; Express, `pg` 8.21, Passport/JWT; no new runtime dependency required

**Storage**: PostgreSQL 15; reuse `study_group`, `group_request`, `reserve_room`, `room_avail`, `study_room`, and `users`, with constraint/index alignment and only the new columns/statuses required by the approved lifecycle

**Testing**: Vitest 4.1 + Supertest 7 for server unit/service/controller/integration tests; client verification through ESLint, TypeScript/Next production build, and manual/E2E quickstart scenarios because no client test runner is configured

**Target Platform**: Responsive web application in modern desktop/mobile browsers; Node.js server connected to PostgreSQL

**Project Type**: Web application with separate `client/` and `server/` projects

**Performance Goals**: Under the specification's normal-load profile (100 users, 23 rooms, 500 groups, 2,000 participation records, exactly 25 concurrent clients, 15% each named read, and 8% each named mutation), per-operation and aggregate p95 dashboard loads and mutations expose results or progress within 2 seconds; p95 pending cancellation disappears from both relevant views within 2 seconds; pagination prevents unbounded payloads

**Constraints**: Preserve Freely Mode; every group has exactly one reservation; cancellation/dissolution permanently deletes eligible room reservations and cascades to linked groups/requests; one active Pending/Approved relationship per user/group; 30-minute cooldown is server-authoritative; capacity cannot exceed the reserved room; all multi-record mutations must be atomic; schema SQL files are authoritative

**Scale/Scope**: Existing small library deployment, approximately 100 simultaneous users, 23 study rooms, seven user journeys, 74 functional requirements, and five delivery slices

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Design Evidence | Status |
|---|---|---|---|
| I. Component-Driven & Reusability | Extend Atomic Design before creating page-specific UI | Reuse Button/Input, StudyGroupCard, StudyGroupGrid, filters, request modal, info modal, and RoomDetailPanel; add only missing atoms/molecules before organism/page changes | PASS |
| II. State & Data Fetching | Explicit loading/error/success; environment base URL | Central Study Group client module uses `apiFetch`/`NEXT_PUBLIC_API_URL`; each page/action exposes loading, empty, error, success, and stale-conflict states | PASS |
| III. Responsive UI | Preserve responsive current design language | Existing grids, drawer, dashboard tabs, cards, and breakpoints are retained and extended | PASS |
| IV. Performance | Select appropriate rendering and bounded data | Interactive flows remain client-side; server pagination/filtering prevents unbounded dashboard/discovery payloads | PASS |
| V. Error Handling & Accessibility | Validate inputs and provide accessible resilient interactions | Client/server validation, keyboard/focus/dialog semantics, confirmation steps, retryable errors, and non-color status labels are required | PASS |
| VI/VIII. Workspace & Imports | Use actual hierarchy and verified imports | Plan references existing paths inspected under `client/app`, `server/src`, and `database/init_db/postgres` | PASS |
| VII. Backend Architecture | Route → Middleware → Controller → Service → Model | New Study Group files follow the mandated layers; transactions and business rules live in services/models, not routes/controllers | PASS |
| IX. Theme & Localization | Light/dark mode and mirrored EN/VI keys | Existing theme tokens/dark variants are reused; all new and currently hard-coded Study Group strings move to both locale dictionaries | PASS |

**Pre-research gate result**: PASS. No constitutional exception is required.

**Post-design re-check**: PASS. The data model, API contract, and quickstart retain the same layering, component reuse, validation, accessibility, localization, theme, and environment configuration obligations.

## Project Structure

### Documentation (this feature)

```text
specs/026-study-group-feature/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── study-groups.openapi.yaml
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
client/
├── app/
│   ├── components/
│   │   ├── atoms/                       # Reuse form/button/badge primitives
│   │   ├── molecules/
│   │   │   ├── StudyGroupCard.tsx       # Adapt to persisted DTO/statuses
│   │   │   ├── StudyGroupFilter.tsx     # Reuse with server query state
│   │   └── organisms/
│   │       ├── RoomDetailPanel.tsx      # Enable Study Group mode and group fields
│   │       ├── StudyGroupGrid.tsx       # Reuse pagination/empty presentation
│   │       └── StudyGroupInfoModal.tsx  # Connect edit/request/member/lifecycle actions
│   ├── dashboard/user/yourstudygroups/page.tsx
│   ├── study-together/
│   │   ├── page.tsx                    # Replace mock list/actions
│   │   └── mockData.ts                 # Remove runtime dependency after type extraction
│   ├── locales/{en,vi}.json
│   ├── types/studyGroup.ts             # Shared client DTO/view types
│   └── utils/
│       ├── apiClient.ts                # Reuse normalized authenticated transport
│       └── studyGroup.ts               # API functions, adapters, status/order helpers
└── package.json

server/
├── src/
│   ├── routes/study-group.routes.mjs
│   ├── controllers/study-group.controllers.mjs
│   ├── services/study-group.services.mjs
│   ├── models/study-group.models.mjs
│   ├── middlewares/study-group.middlewares.mjs
│   ├── middlewares/auth.middleware.mjs
│   ├── models/room.models.mjs           # Active-status query/cancel alignment
│   ├── services/room.services.mjs       # Retained cancellation behavior
│   └── server.mjs                       # Mount /api/study-groups
├── tests/
│   ├── controllers/study-group.controller.spec.mjs
│   ├── services/study-group.service.spec.mjs
│   ├── models/study-group.model.spec.mjs
│   └── integration/study-group.api.spec.mjs
└── package.json

database/init_db/postgres/
├── 05_init_rest.sql                    # Columns/status/check/PK/FK/unique alignment
└── 06_indexes.sql                      # Active uniqueness and query indexes
```

**Structure Decision**: Keep the established split web application and Atomic Design frontend. Add one cohesive Study Group backend resource following the constitution’s exact layered naming. Reuse room code only for shared reservation semantics; keep Study Group orchestration in its own service so Freely Mode remains isolated.

## Phase 0: Research Decisions

Research is consolidated in [research.md](./research.md). The key decisions are:

1. Use one server transaction for reservation-first/group-second creation rather than client-managed compensation.
2. Delete cancelled room reservations; deleting a Study Group reservation cascades to its linked group and participation records so no dissolved history remains.
3. Repair missing PK/FK/unique constraints on existing entities and add only `study_group.created_at/updated_at` plus `group_request.decided_at` needed for ordering/audit/cooldown.
4. Enforce capacity and request races with partial unique indexes, conditional updates, and `SELECT ... FOR UPDATE`.
5. Derive effective group lifecycle from reservation date/time and capacity on every read/action; optionally persist reconciled statuses in the same transaction, avoiding correctness dependence on a scheduler.
6. Use server-side pagination/filtering and authoritative Pending-first, nearest-start discovery ordering with centralized client DTO adapters/status mappings.

All technical unknowns are resolved; no `NEEDS CLARIFICATION` remains.

## Phase 1: Data and Interface Design

### Database Alignment

- Keep `reserve_room.status` limited to `pending`, `reserved`, and `used`; cancellation and Study Group dissolution use permanent deletion.
- Add missing primary and foreign keys to existing reservation/group/request/return tables with `RESTRICT`/`NO ACTION` historical behavior.
- Add `UNIQUE (study_group.reserve_id)` and partial unique indexes for active room slots and active user/group participation.
- Add `group_request.decided_at` for the 30-minute cooldown and `study_group.created_at/updated_at` for newest ordering/audit.
- Add requirements cardinality checks and perform trimming/nonblank validation in the service.
- Audit existing data before applying constraints; migration-safe SQL must fail with actionable diagnostics rather than silently deleting conflicting rows.

Full fields, relationships, invariants, and transitions are in [data-model.md](./data-model.md).

### Backend Design

- `study-group.routes.mjs`: declare authenticated creation/dashboard/mutation routes and optional-auth discovery/detail routes, applying authentication and operation-specific validation middleware before controllers.
- `study-group.middlewares.mjs`: validate and sanitize body, path, and query structure, including UUIDs, required fields, metadata limits, requirement cardinality, pagination, filters, and unsupported values; it does not contain lifecycle, ownership, capacity, or cooldown business rules.
- `study-group.controllers.mjs`: consume validated input and return the standard `{ success, data }` envelope; map validation/authorization/not-found/conflict errors.
- `study-group.services.mjs`: own business normalization, lifecycle derivation, authorization, cooldown, capacity, ordering, and transaction orchestration.
- `study-group.models.mjs`: expose query functions accepting a pool/client; lock rows and issue SQL without business branching.
- `room.models/services.mjs`: retain permanent deletion cancellation and keep active availability predicates centralized and consistent.
- Translate PostgreSQL uniqueness conflicts (`23505`) into deterministic `409` responses.

### Frontend Design

- Move persisted DTO/view types out of `study-together/mockData.ts`; retain mock data only for isolated development fixtures until runtime imports are removed.
- Extend `RoomDetailPanel` mode to `freely | studyGroup`; keep current room/date/slot state, then collect/validate title, description, one subject, and zero-to-five optional requirement bullets before the atomic Study Group call. Title and subject must contain at least one letter.
- Keep Study Together search/filter/card/detail/request layout while loading paginated real data and showing authoritative `canJoin`, participation, and cooldown metadata. Do not expose Sort By; Pending requests are ordered first and each section uses nearest scheduled start.
- Populate multi-select branch and room filters from persisted facility data, support date/time filters server-side before pagination, and include only rooms with capacity of at least one.
- Replace dashboard arrays with created/joined endpoints; preserve tabs/cards/pagination and apply server-defined ordering.
- Connect modal edit/approve/deny/remove/dissolve/leave/cancel actions; disable in flight, confirm destructive actions, refresh authoritative detail/list data after each mutation, and surface `409` stale-state outcomes.
- Reuse one compact `UserProfileHoverCard` molecule on Group Organizer and Approved-member avatar/name triggers inside Study Group detail popups; keep it off outer Study Cards, out of document flow, keyboard-focusable, localized, light/dark compatible, and limited to privacy-safe persisted profile fields.
- Extend created cards with an email-invite action, reuse the configured Nodemailer transport, and project Pending `type=invite` rows into the existing notification bell. Invitation email links and the notification popup share recipient-only Accept/Deny endpoints; acceptance routes to the Joined dashboard with feedback, while denial removes the notification without applying request cooldown.
- Reuse the configured Nodemailer transport for post-commit lifecycle notifications: email an Approved member after host removal, and capture then email distinct Approved/Pending non-host users after dissolution. SMTP failure is logged and isolated from the already committed database mutation.
- Extend the same post-commit transport and targeted user rooms with the approved balanced communication matrix: email-plus-bell for join-request submission/decision and creator-facing member entry; bell-only for Pending cancellation, invitation decline, and one metadata-update event per save to Approved members. Carry stable business-event identifiers and explicit Created/Joined/general destinations in browser snapshots so reconnects do not duplicate items and CTA routing does not infer authorization.
- Make invitation email navigation-only: opening or scanning a link may display the recipient-authorized invitation detail but cannot mutate it. Explicit in-app Accept opens the Joined detail after commit; Deny returns to the general Your Study Groups page. Other email and bell CTA destinations follow the recipient relationship and degrade safely when a group or relationship no longer exists.
- Without adding notification schema, emit removal/dissolution snapshots to the existing authenticated per-user Socket.IO room and persist received items in account-scoped browser local storage for the shared bell. Treat email as the durable fallback for offline and cross-device recipients.
- Add mirrored EN/VI keys for every Study Group label/message and replace hard-coded strings in touched components; use existing theme patterns and improve dialog focus/Escape/ARIA behavior.
- Reuse the existing authenticated Socket.IO connection to notify open Study Together and dashboard views after successful mutations; retain periodic refresh as recovery.
- Preserve calendar-only reservation dates as `YYYY-MM-DD` values through transport and lifecycle evaluation so timezone conversion cannot shift the selected day.

### Interface Contract

The HTTP contract is defined in [contracts/study-groups.openapi.yaml](./contracts/study-groups.openapi.yaml). It includes:

- atomic Study Group reservation creation;
- paginated discovery, created, and joined projections;
- group detail and host-only management detail;
- metadata editing;
- request submission/cancellation/approval/denial;
- member removal and voluntary leave;
- permanent dissolution with foreign-key cascades;
- standard authorization, validation, conflict, cooldown, and stale-state responses.

## Verification Strategy

### Database and Model

- Initialize a clean PostgreSQL database from all authoritative SQL files.
- Assert PK/FK/check/unique constraints, deleted-slot reuse, one group per reservation, and one active participation.
- Run concurrent insert/approval tests for one room slot and the final group place.

### Service and Controller

- Unit-test normalization, status derivation/order, 30-minute boundary, authorization, capacity transitions, and error mapping.
- Middleware coverage is distributed across operation-focused contract suites: creation covers body fields and requirements; created/joined management covers path identifiers and pagination; discovery covers filters, authoritative ordering, pagination, and unsupported query values.
- Transaction tests cover creation rollback, all-or-nothing dissolution rollback at every failure point, stale request action, leave/removal count reconciliation, and idempotent conflict outcomes.
- Supertest integration covers every OpenAPI operation and standard response envelope.

### Frontend and Regression

- Run locale synchronization, ESLint, and production build.
- Execute [quickstart.md](./quickstart.md) across EN/VI, light/dark, keyboard navigation, loading/error/empty/success states, and mobile/desktop breakpoints.
- Run the repeatable normal-load harness after warm-up with exactly 25 concurrent clients, 15% each for discovery/created/joined/detail reads, 8% each for join/approval/denial/Pending-cancellation/leave mutations, and at least 100 samples per named operation; record dataset, per-operation and aggregate p50/p95/error rate, and consistency results.
- Conduct the first-time-user creation study with at least ten eligible participants and record completion time, success rate, validation failures, observed blockers, and whether successful participants divided by total participants is at least 0.90.
- Exercise reservation cancellation through the existing room workflow and verify through the Study Group HTTP API that the linked group immediately becomes non-joinable and non-manageable.
- Re-run all Freely Mode scenarios and server tests to prove no regression.

## Delivery Sequencing

1. **Foundation**: schema alignment, constraints, shared types, backend layers, validation middleware, and contract foundations.
2. **Creation**: atomic reservation-backed Study Group creation and Freely Mode regression.
3. **Host Dashboard**: persisted created groups, operational ordering, detail, and metadata editing.
4. **Host Management**: approval, denial, member removal, capacity concurrency, and stale-action handling.
5. **Dissolution**: atomic permanent deletion and slot release.
6. **Discovery**: persisted Study Together listing, detail, filters, join requests, duplicate prevention, and 30-minute cooldown.
7. **Participant Dashboard**: persisted joined records, ordering, pending cancellation, and voluntary leave.
8. **Quality**: contract, localization, theme, accessibility, regression, concurrency, performance, and first-time-user verification.

## Complexity Tracking

No constitution violations require justification. The schema changes repair missing integrity on existing entities and add required lifecycle metadata; they do not introduce redundant storage structures.
